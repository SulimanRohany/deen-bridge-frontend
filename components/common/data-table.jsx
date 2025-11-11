"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export default function DataTable({ columns, rows, keyField }) {
return (
<Table>
<TableHeader>
<TableRow>
{columns.map((c) => (<TableHead key={String(c.key)}>{c.label}</TableHead>))}
</TableRow>
</TableHeader>
<TableBody>
{rows.map((r) => (
<TableRow key={String((r)[keyField])}>
{columns.map((c) => (
<TableCell key={String(c.key)}>{c.render ? c.render(r) : String((r)[c.key])}</TableCell>
))}
</TableRow>
))}
</TableBody>
</Table>
);
}