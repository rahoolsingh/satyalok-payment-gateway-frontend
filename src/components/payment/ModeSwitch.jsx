import PropTypes from "prop-types";
import { Heart, Repeat } from "lucide-react";

/**
 * Segmented control for donation frequency.
 *
 * The white pill is one element that slides between the two labels, so the
 * change of mode reads as a single motion instead of two buttons swapping
 * styles. Width is exactly half of the inner grid, so translateX(100%) lands on
 * the second segment without magic numbers.
 */

const OPTIONS = [
    { id: "once", label: "One-time", Icon: Heart },
    { id: "monthly", label: "Monthly", Icon: Repeat },
];

export default function ModeSwitch({ value, onChange }) {
    const index = Math.max(
        0,
        OPTIONS.findIndex((option) => option.id === value),
    );

    return (
        <div
            role="tablist"
            aria-label="Donation frequency"
            className="rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
            <div className="relative grid grid-cols-2">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(${index * 100}%)` }}
                />
                {OPTIONS.map(({ id, label, Icon }) => {
                    const active = id === value;

                    return (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(id)}
                            className={`relative z-10 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition-colors duration-200 ${
                                active
                                    ? "font-semibold text-slate-900"
                                    : "font-medium text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <Icon
                                size={16}
                                strokeWidth={1.5}
                                className={active ? "text-blue-600" : "text-slate-400"}
                            />
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
ModeSwitch.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};
