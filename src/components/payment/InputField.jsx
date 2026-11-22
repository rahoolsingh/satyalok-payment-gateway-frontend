/* eslint-disable react/prop-types -- Presentational helper shared by the one-time
   and monthly forms; both pages keep their own local prop-types policy. */
import { AlertCircle } from "lucide-react";

/**
 * The single input style used by both donation forms.
 *
 * Paper-and-ink: white field on a hairline, ink text, blue focus ring. The
 * shared `pl-field` class keeps this identical to the pledge and portal pages.
 */
export default function InputField({
    label,
    name,
    type,
    placeholder,
    value,
    onChange,
    error,
    icon: Icon,
    hint,
    idPrefix = "field",
}) {
    const inputId = `${idPrefix}-${name}`;
    return (
        <div className="w-full space-y-1.5">
            <label
                htmlFor={inputId}
                className="text-[13px] font-medium text-[#5e554a]"
            >
                {label}
            </label>
            <div className="relative flex items-center">
                {Icon && (
                    <div className="pointer-events-none absolute left-3.5 text-[#8a847a]">
                        <Icon size={18} strokeWidth={1.5} />
                    </div>
                )}
                <input
                    id={inputId}
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={
                        "pl-field " +
                        (error ? "pl-field-error " : "") +
                        (Icon ? "pl-11" : "")
                    }
                />
            </div>
            {error ? (
                <p className="mt-1 flex items-center gap-1 text-[12px] text-[#b4463c]">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            ) : (
                hint && <p className="text-[12px] text-[#8a847a]">{hint}</p>
            )}
        </div>
    );
}