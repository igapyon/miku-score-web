import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";
import { readZipEntries } from "./lib/zip-inspect.mjs";

const root = process.cwd();
const fileUrl = pathToFileURL(path.join(root, "index.html")).href;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const unexpectedRequests = [];
  const pageErrors = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("file:")) unexpectedRequests.push(request.url());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(fileUrl, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(globalThis.__mikuScoreWebRuntime));
  const firstHelpTooltip = page.locator("lht-help-tooltip").first();
  await firstHelpTooltip.locator("button").click();
  assert.equal(await firstHelpTooltip.getAttribute("open"), "");
  assert.equal(await firstHelpTooltip.locator("[role='tooltip']").isVisible(), true);
  const v2Available = await page.evaluate(() => globalThis.__mikuScoreWebRuntime.v2Available === true);
  const fileLoadOverlay = page.locator("#fileLoadOverlay");
  assert.equal(await fileLoadOverlay.getAttribute("role"), "status");
  assert.equal(await fileLoadOverlay.getAttribute("aria-live"), "polite");
  assert.equal(await fileLoadOverlay.getAttribute("aria-hidden"), "true");
  await page.evaluate(() => document.querySelector("#fileLoadOverlay")?.setActive(true));
  assert.equal(await fileLoadOverlay.isVisible(), true);
  assert.equal(await page.locator("#fileConversionControls").getAttribute("aria-busy"), "true");
  await page.evaluate(() => document.querySelector("#fileLoadOverlay")?.setActive(false));
  assert.equal(await fileLoadOverlay.isHidden(), true);
  assert.equal(await page.locator("#fileConversionControls").getAttribute("aria-busy"), "false");
  if (!v2Available) {
    assert.equal(await page.locator("#runtimeV2ImportPolicy").isHidden(), true);
    assert.equal(await page.locator("#runtimeV2ExportPolicy").isHidden(), true);
    assert.equal(await page.locator("#measureEditor").isHidden(), true);
  }

  await page.locator("#abcInput").fill("X:1\nM:4/4\nL:1/4\nK:C\nC D E F|");
  await page.locator("#convertAbc").click();
  await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("Converted ABC"));
  await page.waitForFunction(() => document.querySelector("#musicXmlOutput")?.value.includes("<score-partwise"));

  await page.locator("#sourceFormat").selectOption("abc");
  await page.locator("#sourceInput").fill("");
  await page.locator("#importSource").click();
  await page.waitForFunction(() => document.querySelector("#errorAlert")?.hasAttribute("active") === true);
  assert.match(await page.locator("#errorAlert").textContent(), /MKS_INPUT_INVALID/);
  assert.equal(await page.locator("#errorAlert").getAttribute("role"), "alert");
  assert.equal(await page.locator("#errorAlert").getAttribute("aria-hidden"), "false");
  await page.locator("#sourceInput").fill("X:2\nM:4/4\nL:1/4\nK:G\nG A B c|");
  await page.locator("#importSource").click();
  await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("Imported abc text"));
  assert.equal(await page.locator("#errorAlert").isHidden(), true);

  await page.locator("#renderScore").click();
  await page.waitForSelector("#scorePreview svg");
  await page.waitForFunction(() => document.querySelector("#noteSelect")?.disabled === false);
  await page.locator("#noteSelect").selectOption({ index: 1 });
  await page.locator("#pitchStep").selectOption("D");
  await page.locator("#applyPitch").click();
  await page.waitForFunction(() => document.querySelector("#musicXmlOutput")?.value.includes("<step>D</step>"));

  if (v2Available) {
    await page.locator("#renderScore").click();
    await page.waitForSelector("#scorePreview svg");
    await page.waitForFunction(() => document.querySelector("#loadMeasureEditor")?.disabled === false);
    assert.equal(await page.locator("#runtimeV2ImportPolicy").isVisible(), true);
    assert.equal(await page.locator("#runtimeV2ExportPolicy").isVisible(), true);
    assert.equal(await page.locator("#measureEditor").isVisible(), true);
    await page.locator("#loadMeasureEditor").click();
    await page.waitForFunction(() => document.querySelector("#measureEditorXml")?.value.includes("<score-partwise"));
    const measureXml = await page.locator("#measureEditorXml").inputValue();
    await page.locator("#measureEditorXml").fill(measureXml.replace("<step>D</step>", "<step>G</step>"));
    await page.locator("#applyMeasureEditor").click();
    await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("Applied isolated measure edit"));
    await page.waitForFunction(() => document.querySelector("#musicXmlOutput")?.value.includes("<step>G</step>"));
    await page.locator("#renderScore").click();
    await page.waitForSelector("#scorePreview svg");
    await page.locator("#noteSelect").selectOption({ index: 1 });
    await page.locator("#loadMeasureEditor").click();
    const [measureDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#downloadMeasureMusicXml").click(),
    ]);
    assert.equal(measureDownload.suggestedFilename(), "miku-score-P1-measure-1.musicxml");
    await page.locator("#appendMeasure").click();
    await page.waitForFunction(() => document.querySelector("#musicXmlOutput")?.value.includes('<measure number="2"'));
  }

  await page.locator("#exportFormat").selectOption("vsqx");
  await page.locator("#vsqxDefaultLyric").fill("み");
  await page.locator("#vsqxSplitPartStaves").check();
  const [vsqxDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#exportFile").click(),
  ]);
  assert.equal(vsqxDownload.suggestedFilename(), "miku-score.vsqx");
  const vsqxStream = await vsqxDownload.createReadStream();
  assert.ok(vsqxStream, "VSQX download stream must be available");
  const vsqxChunks = [];
  for await (const chunk of vsqxStream) vsqxChunks.push(chunk);
  assert.match(Buffer.concat(vsqxChunks).toString("utf8"), /<y>み<\/y>/);

  const [archiveDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#exportAll").click(),
  ]);
  assert.equal(archiveDownload.suggestedFilename(), "miku-score-all.zip");
  const archiveStream = await archiveDownload.createReadStream();
  assert.ok(archiveStream, "ZIP download stream must be available");
  const archiveChunks = [];
  for await (const chunk of archiveStream) archiveChunks.push(chunk);
  const archiveEntries = readZipEntries(Buffer.concat(archiveChunks));
  assert.match(new TextDecoder().decode(archiveEntries.get("miku-score.vsqx")), /<y>み<\/y>/);

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#selectScoreFile").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "browser.abc",
    mimeType: "text/vnd.abc",
    buffer: Buffer.from("X:2\nM:4/4\nL:1/4\nK:G\nG A B c|"),
  });
  assert.equal(await page.locator("#selectedScoreFileName").textContent(), "browser.abc");
  await page.locator("#importFormat").selectOption("auto");
  await page.locator("#importFile").click();
  await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("Imported browser.abc as abc"));
  await page.waitForFunction(() => document.querySelector("#musicXmlOutput")?.value.includes("<fifths>1</fifths>"));

  if (v2Available) {
    const [zipDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#exportAll").click(),
    ]);
    const zipStream = await zipDownload.createReadStream();
    assert.ok(zipStream, "ZIP stream must be available for root-entry import");
    const zipChunks = [];
    for await (const chunk of zipStream) zipChunks.push(chunk);
    await page.locator("#scoreFile").setInputFiles({
      name: "root-entry.zip",
      mimeType: "application/zip",
      buffer: Buffer.concat(zipChunks),
    });
    await page.locator("#importFormat").selectOption("auto");
    await page.locator("#importFile").click();
    await page.waitForFunction(() => document.querySelector("#zipEntrySelect")?.disabled === false);
    await page.locator("#zipEntrySelect").selectOption("miku-score.abc");
    await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("root-entry.zip / miku-score.abc"));

    await page.locator("#importSourceMetadata").uncheck();
    await page.locator("#importDebugMetadata").uncheck();
    await page.locator("#sourceFormat").selectOption("abc");
    await page.locator("#sourceInput").fill("X:3\nM:4/4\nL:1/4\nK:C\nC D E F|");
    await page.locator("#importSource").click();
    await page.waitForFunction(() => document.querySelector("#status")?.textContent?.includes("Imported abc text"));
    await page.waitForFunction(() => !document.querySelector("#musicXmlOutput")?.value.includes("mks:src:abc:"));
    await page.waitForFunction(() => !document.querySelector("#musicXmlOutput")?.value.includes("mks:dbg:abc:"));
  }

  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#status")?.textContent === "Restored local draft.");
  if (v2Available) {
    await page.waitForFunction(() => !document.querySelector("#musicXmlOutput")?.value.includes("<fifths>1</fifths>"));
    await page.waitForFunction(() => !document.querySelector("#musicXmlOutput")?.value.includes("mks:src:abc:"));
  } else {
    await page.waitForFunction(() => document.querySelector("#musicXmlOutput")?.value.includes("<fifths>1</fifths>"));
  }
  assert.equal(await page.locator("#vsqxDefaultLyric").inputValue(), "み");
  assert.equal(await page.locator("#vsqxSplitPartStaves").isChecked(), true);
  await page.locator("#resetBrowserSettings").click();
  assert.equal(await page.locator("#vsqxDefaultLyric").inputValue(), "ら");
  assert.equal(await page.locator("#vsqxSplitPartStaves").isChecked(), false);
  await page.locator("#clearLocalDraft").click();
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => Boolean(globalThis.__mikuScoreWebRuntime));
  assert.equal(await page.locator("#musicXmlOutput").inputValue(), "");
  assert.equal(await page.locator("#clearLocalDraft").isDisabled(), true);
  assert.equal(await page.locator("#vsqxDefaultLyric").inputValue(), "ら");

  assert.deepEqual(unexpectedRequests, []);
  assert.deepEqual(pageErrors, []);
} finally {
  await browser.close();
}

console.log("[smoke:browser-e2e] ok Chromium conversion preview edit downloads file import local draft and browser settings");
