/* eslint-disable react/prop-types -- Presentational helper shared by the one-time
   and monthly forms; both pages keep their own local prop-types policy. */
import { AlertCircle } from "lucide-react";

/**
 * The single input style used by both donation forms.
 *
 * Kept in its own file so the one-time and monthly forms cannot drift apart:
 * same height, radius, ring, focus state and error treatment everywhere.
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
}) {
    return (
        <div className="w-full space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
                {label}
            </label>
            <div className="relative flex items-center">
                {Icon && (
                    <div className="pointer-events-none absolute left-3.5 text-slate-400">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none ring-1 transition-all placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 ${
                        error
                            ? "bg-red-50/50 ring-red-300 focus:ring-red-500"
                            : "ring-slate-200 hover:ring-slate-300 focus:ring-blue-600"
                    } ${Icon ? "pl-11" : ""}`}
                />
            </div>
            {error ? (
                <p className="mt-1 flex items-center text-xs font-medium text-red-600">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {error}
                </p>
            ) : (
                hint && <p className="text-xs text-slate-400">{hint}</p>
            )}
        </div>
    );
}