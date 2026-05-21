import { useId, useRef, type ChangeEvent, type DragEvent } from "react";
import { FileUp, X } from "lucide-react";
import "./FileInput.css";

export interface FileInputProps {
    label?: string;
    accept?: string;
    value?: File | null;
    onChange: (file: File | null) => void;
    disabled?: boolean;
    hint?: string;
    buttonText?: string;
    previewUrl?: string | null;
    fullWidth?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileInput({
    label,
    accept,
    value = null,
    onChange,
    disabled = false,
    hint,
    buttonText = "Выбрать файл",
    previewUrl,
    fullWidth = true,
}: FileInputProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);

    const pickFile = (file: File | null) => {
        if (disabled) return;
        onChange(file);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        pickFile(e.target.files?.[0] ?? null);
        e.target.value = "";
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) pickFile(file);
    };

    const openPicker = () => {
        if (!disabled) inputRef.current?.click();
    };

    const clearFile = () => {
        pickFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const showImagePreview =
        previewUrl && !value && accept?.includes("image");

    return (
        <div className={`ui-file-input${fullWidth ? " ui-file-input--full" : ""}`}>
            {label ? (
                <label className="ui-file-input__label" htmlFor={inputId}>
                    {label}
                </label>
            ) : null}

            {showImagePreview ? (
                <img src={previewUrl} alt="" className="ui-file-input__preview-image" />
            ) : null}

            <div
                className={`ui-file-input__zone${disabled ? " ui-file-input__zone--disabled" : ""}${value ? " ui-file-input__zone--filled" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={openPicker}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPicker();
                    }
                }}
            >
                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    className="ui-file-input__native"
                    accept={accept}
                    disabled={disabled}
                    onChange={handleInputChange}
                    tabIndex={-1}
                />

                <FileUp size={22} className="ui-file-input__icon" aria-hidden />

                {value ? (
                    <div className="ui-file-input__file-info">
                        <span className="ui-file-input__file-name">{value.name}</span>
                        <span className="ui-file-input__file-size">{formatFileSize(value.size)}</span>
                    </div>
                ) : (
                    <div className="ui-file-input__placeholder">
                        <span className="ui-file-input__button-text">{buttonText}</span>
                        <span className="ui-file-input__drag-hint">или перетащите сюда</span>
                    </div>
                )}
            </div>

            {value ? (
                <button
                    type="button"
                    className="ui-file-input__clear"
                    onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                    }}
                    disabled={disabled}
                >
                    <X size={16} aria-hidden />
                    Убрать файл
                </button>
            ) : null}

            {hint ? <p className="ui-file-input__hint">{hint}</p> : null}
        </div>
    );
}
