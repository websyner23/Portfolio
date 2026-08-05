import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
};

const modules = {
  toolbar: [
    [{ header: [2, 3, 4, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    [{ align: [] }],
    ["clean"],
  ],
};

const RichText = ({ value, onChange, placeholder, height = 220 }: Props) => (
  <div className="websyner-quill">
    <ReactQuill
      theme="snow"
      value={value ?? ""}
      onChange={onChange}
      modules={modules}
      placeholder={placeholder}
      style={{ height, marginBottom: 42 }}
    />
  </div>
);

export default RichText;
