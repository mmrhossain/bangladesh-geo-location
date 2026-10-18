import { useEffect, useRef, useState } from "react";
import {
    describeError,
    getHierarchy,
    isAbortError,
} from "@/lib/api";
import type { HierarchyResult } from "@/lib/types";

type HierarchyState = {
    key: string;
    data: HierarchyResult | null;
    error: string | null;
};

export function useHierarchy(
    depth: number,
    includeDeprecated: boolean,
    initialData: HierarchyResult | null = null
) {
    const seed =
        depth === 2 && !includeDeprecated ? initialData : null;
    const [state, setState] = useState<HierarchyState | null>(
        seed
            ? {
                  key: `${depth}:${includeDeprecated}:0`,
                  data: seed,
                  error: null,
              }
            : null
    );
    const [reloadToken, setReloadToken] = useState(0);
    const hasInitialData = useRef(seed !== null);
    const key = `${depth}:${includeDeprecated}:${reloadToken}`;

    useEffect(() => {
        if (hasInitialData.current) {
            hasInitialData.current = false;
            return;
        }

        const controller = new AbortController();
        const requestKey = `${depth}:${includeDeprecated}:${reloadToken}`;

        getHierarchy({
            depth,
            includeDeprecated,
            signal: controller.signal,
        })
            .then((hierarchy) => {
                setState({ key: requestKey, data: hierarchy, error: null });
            })
            .catch((caught) => {
                if (!isAbortError(caught)) {
                    setState({
                        key: requestKey,
                        data: null,
                        error: describeError(caught),
                    });
                }
            });

        return () => {
            controller.abort();
        };
    }, [depth, includeDeprecated, reloadToken]);

    const loading = state === null || state.key !== key;
    const data = state?.key === key ? state.data : null;
    const error = state?.key === key ? state.error : null;

    function reload() {
        setReloadToken((current) => current + 1);
    }

    return { data, error, loading, reload };
}
