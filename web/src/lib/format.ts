export function cn(
    ...values: Array<string | false | null | undefined>
): string {
    return values.filter(Boolean).join(" ");
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number | null | undefined): string {
    return numberFormatter.format(value ?? 0);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
});

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return "Not recorded";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not recorded";
    }

    return dateFormatter.format(date);
}

export function pluralize(
    count: number,
    singular: string,
    plural?: string
): string {
    if (count === 1) {
        return singular;
    }

    return plural ?? `${singular}s`;
}

export function shortCode(value: string | null | undefined): string {
    return value || "—";
}

export function splitAliases(value: string): string[] {
    return value
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean);
}
