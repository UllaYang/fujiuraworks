import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath =
  "/Users/fujiuratakashi/Desktop/【藤製】02_請求書データベース.xlsx";
const workDir = path.resolve(".codex-work/invoice-db");

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,definedName,drawing",
  include: "id,name,range,formula,type",
  maxChars: 24000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});
console.log("SUMMARY");
console.log(summary.ndjson);

const sheets = workbook.worksheets.items;
for (const sheet of sheets) {
  const used = sheet.getUsedRange();
  console.log(
    `SHEET\t${sheet.name}\t${used ? used.address : "(empty)"}`,
  );

  if (used) {
    const formulas = await workbook.inspect({
      kind: "formula",
      sheetId: sheet.name,
      range: used.address.split("!").at(-1),
      maxChars: 12000,
      options: { maxResults: 300 },
    });
    console.log(`FORMULAS\t${sheet.name}`);
    console.log(formulas.ndjson);

    const preview = await workbook.render({
      sheetName: sheet.name,
      autoCrop: "all",
      scale: 1,
      format: "png",
    });
    const safeName = sheet.name.replaceAll(/[\\/:*?"<>|]/g, "_");
    await fs.writeFile(
      path.join(workDir, `${safeName}.png`),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }
}
