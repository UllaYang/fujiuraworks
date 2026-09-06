import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath =
  "/Users/fujiuratakashi/Desktop/【藤製】02_請求書データベース.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const billing = workbook.worksheets.getItem("Billing");
const range = billing.getRange("A1:K1100");
const values = range.values;
const formulas = range.formulas;

const nonEmptyRows = [];
const amountFormulaMissing = [];
for (let index = 4; index < values.length; index += 1) {
  const rowNumber = index + 1;
  const row = values[index];
  const hasInput = row.slice(1, 11).some((value) => value !== null && value !== "");
  if (!hasInput) continue;

  nonEmptyRows.push(rowNumber);
  const quantity = row[5];
  const price = row[7];
  const amountFormula = formulas[index]?.[8] ?? "";
  if (
    quantity !== null &&
    quantity !== "" &&
    price !== null &&
    price !== "" &&
    !amountFormula
  ) {
    amountFormulaMissing.push({
      row: rowNumber,
      quantity,
      price,
      amount: row[8],
    });
  }
}

console.log(
  JSON.stringify(
    {
      nonEmptyCount: nonEmptyRows.length,
      firstNonEmpty: nonEmptyRows.slice(0, 20),
      lastNonEmpty: nonEmptyRows.slice(-40),
      missingAmountFormulaCount: amountFormulaMissing.length,
      missingAmountFormula: amountFormulaMissing.slice(0, 60),
    },
    null,
    2,
  ),
);

const paymentDeadlineRows = [];
for (let index = 4; index < values.length; index += 1) {
  const row = values[index];
  if (row[9] === null || row[9] === "") continue;
  paymentDeadlineRows.push({
    row: index + 1,
    invoice: row[1],
    previousInvoice: values[index - 1]?.[1],
    deadline: row[9],
    isFirstInvoiceRow: row[1] !== values[index - 1]?.[1],
  });
}
console.log(
  JSON.stringify(
    {
      paymentDeadlineCount: paymentDeadlineRows.length,
      paymentDeadlineNotOnFirstInvoiceRow: paymentDeadlineRows.filter(
        (item) => !item.isFirstInvoiceRow,
      ),
      latestPaymentDeadlineRows: paymentDeadlineRows.slice(-30),
    },
    null,
    2,
  ),
);

for (const [start, end] of [
  [735, 755],
  [1030, 1050],
]) {
  console.log(`ROWS ${start}:${end}`);
  for (let rowNumber = start; rowNumber <= end; rowNumber += 1) {
    const row = values[rowNumber - 1];
    const rowFormulas = formulas[rowNumber - 1];
    if (
      !row.slice(1, 11).some((value) => value !== null && value !== "") &&
      !rowFormulas.some(Boolean)
    ) {
      continue;
    }
    console.log(
      JSON.stringify({
        row: rowNumber,
        values: row.slice(1, 11),
        formulas: rowFormulas.slice(1, 11),
      }),
    );
  }
}
