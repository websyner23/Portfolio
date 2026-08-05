import { Button } from "antd";
import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";

type Props = {
  /** Rows already flattened to the columns you want in the sheet. */
  rows: Record<string, unknown>[];
  fileName: string;
  sheetName?: string;
  disabled?: boolean;
  label?: string;
};

/** Downloads the given rows as an .xlsx file, entirely client-side. */
const ExportXlsxButton = ({
  rows,
  fileName,
  sheetName = "Sheet1",
  disabled,
  label = "Export",
}: Props) => {
  const onExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Button
      icon={<FiDownload />}
      onClick={onExport}
      disabled={disabled || rows.length === 0}
    >
      {label}
    </Button>
  );
};

export default ExportXlsxButton;
