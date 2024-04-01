"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { TProduct, TProductUpdateInput } from "@formbricks/types/product";

import { handleFileUpload } from "../../../../apps/web/app/(app)/environments/[environmentId]/settings/profile/lib";
import { Button } from "../../Button";
import FileInput from "../../FileInput";
import { Input } from "../../Input";
import LoadingSpinner from "../../LoadingSpinner";
import { ColorSelectorWithLabel } from "../../Styling";
import { updateProductAction } from "../actions";

interface LogoChangeEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & EventTarget;
}
interface LogoSettingProps {
  imageUrl: string;
  environmentId: string;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setImage?: React.Dispatch<React.SetStateAction<string>>;
  product: TProduct;
  fromLookAndFeelSetting?: boolean;
  imageUploadFromRegularFileUpload?: boolean;
  setLocalProduct?: React.Dispatch<React.SetStateAction<TProduct>>;
  setImageUrlFromLogoButton?: React.Dispatch<React.SetStateAction<string>>;
  setIsImageAddedFromAddLogoButton?: React.Dispatch<React.SetStateAction<boolean>>;
  fromEditLogo?: boolean;
}
export const LogoSetting: React.FC<LogoSettingProps> = ({
  imageUrl,
  environmentId,
  setOpen,
  product,
  fromLookAndFeelSetting = false,
  setImage,
  imageUploadFromRegularFileUpload,
  setLocalProduct,
  setImageUrlFromLogoButton,
  setIsImageAddedFromAddLogoButton,
  fromEditLogo,
}) => {
  const [backgroundColor, setBackgroundColor] = useState(product?.brand?.bgColor || "#ffffff");
  const [isLoading, setIsLoading] = useState(false);
  const [isStandardFileUploadOpen, setIsStandardFileUploadOpen] = useState(false);
  const [replacedLogo, setReplacedLogo] = useState<string>(imageUrl);
  const [isEdit, setIsEdit] = useState(imageUploadFromRegularFileUpload);
  const replaceLogoRef = useRef<HTMLInputElement>(null);

  const onchangeImageHandler = async (e: LogoChangeEvent) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file, environmentId);
    }
  };
  const handleUpload = async (file: File, environmentId: string) => {
    setIsLoading(true);
    try {
      const { url, error } = await handleFileUpload(file, environmentId);

      if (error) {
        toast.error(error);
        return;
      }

      setReplacedLogo(url);

      setIsStandardFileUploadOpen(false);
    } catch (err) {
      toast.error("Logo upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (fromEditLogo) {
        let inputProduct: Partial<TProductUpdateInput> = {
          brand: { logoUrl: replacedLogo, bgColor: backgroundColor },
        };
        await updateProductAction(product.id, inputProduct);
      }
      setLocalProduct &&
        setLocalProduct({
          ...product,
          brand: { logoUrl: replacedLogo, bgColor: backgroundColor },
        });
      setIsImageAddedFromAddLogoButton && setIsImageAddedFromAddLogoButton(true);
      setImage && setImage(replacedLogo);

      setImageUrlFromLogoButton && setImageUrlFromLogoButton(replacedLogo);
      toast.success("Logo uploaded successfully.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        throw error;
      }
    }
  };
  return (
    <>
      <div className="relative">
        {!isEdit && fromLookAndFeelSetting && <div className="absolute z-30 h-full w-full"></div>}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-slate-700">Preview</div>
            {!isStandardFileUploadOpen ? (
              <Image
                src={`${replacedLogo ? replacedLogo : imageUrl}`}
                alt="logo"
                style={{ backgroundColor: backgroundColor }}
                className="h-20 w-auto max-w-64 rounded-lg border object-contain p-1 "
                width={256}
                height={56}
              />
            ) : (
              <FileInput
                id="Companylogo-input"
                allowedFileExtensions={["png", "jpeg"]}
                environmentId={environmentId}
                onFileUpload={(url: string[] | undefined) => {
                  if (url && url.length > 0) {
                    setReplacedLogo(url[0]);
                    setIsStandardFileUploadOpen(false);
                  }
                }}
              />
            )}

            <div className="flex gap-4">
              {(isEdit || !fromLookAndFeelSetting) && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (replaceLogoRef.current) {
                        replaceLogoRef.current.click();
                      }
                    }}
                    disabled={isLoading}>
                    Replace logo
                  </Button>
                  <Input
                    ref={replaceLogoRef}
                    className="hidden"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => onchangeImageHandler(e)}
                  />
                </>
              )}

              {(isEdit || !fromLookAndFeelSetting) && (
                <Button
                  variant="minimal"
                  onClick={() => {
                    setIsStandardFileUploadOpen(true);
                    setReplacedLogo("");
                  }}>
                  Remove logo
                </Button>
              )}
            </div>
          </div>
          <ColorSelectorWithLabel
            label="Background color"
            color={backgroundColor}
            setColor={setBackgroundColor}
            description="Change the background color of the logo container."
          />
        </div>
      </div>
      <div className={`mt-3 flex gap-3 ${!fromLookAndFeelSetting && "justify-end"}`}>
        {(isEdit || !fromLookAndFeelSetting) && (
          <Button
            variant="minimal"
            onClick={() => {
              setReplacedLogo(imageUrl);
              setBackgroundColor(product?.brand?.bgColor);
              setOpen && setOpen(false);
              setImage && setImage(product?.brand?.logoUrl);
              setIsStandardFileUploadOpen(false);
              setIsEdit(false);
            }}>
            Cancel
          </Button>
        )}
        <Button
          variant="darkCTA"
          onClick={() => {
            (isEdit || !fromLookAndFeelSetting) && handleSave();
            setOpen && setOpen(false);
            setIsEdit(!isEdit);
          }}
          disabled={isLoading}>
          {!fromLookAndFeelSetting || isEdit ? "Save" : "Edit"}
        </Button>
      </div>
    </>
  );
};