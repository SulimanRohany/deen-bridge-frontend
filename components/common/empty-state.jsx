"use client";
import { Button } from "@/components/ui/button";
export default function EmptyState({ title="Nothing here yet", actionText, onAction }) {
return (
<div className="text-center p-10 border rounded-xl">
<p className="text-muted-foreground mb-4">{title}</p>
{actionText && <Button variant="default" onClick={onAction}>{actionText}</Button>}
</div>
);
}