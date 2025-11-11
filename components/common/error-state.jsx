"use client";
export default function ErrorState({ message }) {
return (
<div className="text-red-500 p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/20">
{message || "Something went wrong."}
</div>
);
}