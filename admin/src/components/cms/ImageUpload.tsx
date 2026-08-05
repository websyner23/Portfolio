import { Button, Image, Space, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useUploadMediaMutation } from "../../redux/api/cmsApi";

export type TImageValue = { url?: string; publicId?: string } | undefined;

type Props = {
  value?: TImageValue;
  onChange?: (value: TImageValue) => void;
  folder?: string;
  /** Crop aspect ratio; omit to upload without cropping. */
  aspect?: number;
  height?: number;
};

const ImageUpload = ({
  value,
  onChange,
  folder = "websyner",
  aspect,
  height = 120,
}: Props) => {
  const [uploadMedia] = useUploadMediaMutation();
  const [uploading, setUploading] = useState(false);

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await uploadMedia(formData).unwrap();
      onChange?.({ url: res.data.url, publicId: res.data.publicId });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Upload failed — check the Cloudinary keys in backend/.env"
      );
    } finally {
      setUploading(false);
    }
  };

  const uploader = (
    <Upload
      accept="image/*"
      showUploadList={false}
      beforeUpload={(file) => {
        void doUpload(file);
        return false;
      }}
    >
      <Button icon={<FiUpload />} loading={uploading}>
        {value?.url ? "Replace image" : "Upload image"}
      </Button>
    </Upload>
  );

  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      {value?.url && (
        <Image
          src={value.url}
          height={height}
          style={{ objectFit: "cover", borderRadius: 8 }}
        />
      )}
      <Space>
        {aspect ? (
          <ImgCrop rotationSlider aspect={aspect}>
            {uploader}
          </ImgCrop>
        ) : (
          uploader
        )}
        {value?.url && (
          <Button
            icon={<FiX />}
            danger
            onClick={() => onChange?.(undefined)}
          >
            Remove
          </Button>
        )}
      </Space>
    </Space>
  );
};

export default ImageUpload;
