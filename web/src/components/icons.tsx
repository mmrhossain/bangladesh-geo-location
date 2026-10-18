import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export function OverviewIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </Icon>
    );
}

export function ExploreIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="m15.6 8.4-2 5.2-5.2 2 2-5.2 5.2-2Z" />
        </Icon>
    );
}

export function SearchIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </Icon>
    );
}

export function HierarchyIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
        </Icon>
    );
}

export function DatasetIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
        </Icon>
    );
}

export function AdminIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3 4.5 6v5.5c0 4.4 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5.1 7.5-9.5V6L12 3Z" />
            <path d="m9 12 2 2 4-4" />
        </Icon>
    );
}

export function MenuIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </Icon>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m6 6 12 12M18 6 6 18" />
        </Icon>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m9 6 6 6-6 6" />
        </Icon>
    );
}

export function ChevronDownIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m6 9 6 6 6-6" />
        </Icon>
    );
}

export function RefreshIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20 11a8 8 0 1 0-2.3 6.3" />
            <path d="M20 5v6h-6" />
        </Icon>
    );
}

export function SpinnerIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3a9 9 0 1 0 9 9" />
        </Icon>
    );
}

export function CheckIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m5 12 4.5 4.5L19 7" />
        </Icon>
    );
}

export function AlertIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 4 2.8 20h18.4L12 4Z" />
            <path d="M12 9v5" />
            <path d="M12 17.5h.01" />
        </Icon>
    );
}

export function EditIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
        </Icon>
    );
}

export function EyeOffIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a16.5 16.5 0 0 1-2.1 3.1" />
            <path d="M6.6 6.6C4.3 8.1 3 12 3 12s3.5 7 9 7c1.3 0 2.5-.4 3.6-1" />
        </Icon>
    );
}

export function EyeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
            <circle cx="12" cy="12" r="3" />
        </Icon>
    );
}

export function ArrowLeftIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M19 12H5" />
            <path d="m11 18-6-6 6-6" />
        </Icon>
    );
}

export function ArrowRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </Icon>
    );
}

export function CodeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m8 8-4 4 4 4" />
            <path d="m16 8 4 4-4 4" />
            <path d="m13 5-2 14" />
        </Icon>
    );
}

export function MapPinIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </Icon>
    );
}

export function UploadIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </Icon>
    );
}

export function KeyIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="8" cy="15" r="4" />
            <path d="m11 12 9-9" />
            <path d="m16 7 2 2" />
            <path d="m18 5 2 2" />
        </Icon>
    );
}

export function CopyIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        </Icon>
    );
}
