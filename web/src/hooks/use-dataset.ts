import { useEffect, useRef, useState } from "react";
import {
    describeError,
    getDatasetMeta,
    getReadiness,
    isAbortError,
} from "@/lib/api";
import type { DatasetMeta, ReadinessResponse } from "@/lib/types";

type RequestState<T> = {
    token: number;
    data: T | null;
    error: string | null;
};

export function useDatasetMeta(initialData: DatasetMeta | null = null) {
    const [state, setState] = useState<RequestState<DatasetMeta> | null>(
        initialData ? { token: 0, data: initialData, error: null } : null
    );
    const [reloadToken, setReloadToken] = useState(0);
    const hasInitialData = useRef(initialData !== null);
    const token = reloadToken;

    useEffect(() => {
        if (hasInitialData.current) {
            hasInitialData.current = false;
            return;
        }

        const controller = new AbortController();

        getDatasetMeta({ signal: controller.signal })
            .then((meta) => {
                setState({ token, data: meta, error: null });
            })
            .catch((caught) => {
                if (!isAbortError(caught)) {
                    setState({
                        token,
                        data: null,
                        error: describeError(caught),
                    });
                }
            });

        return () => {
            controller.abort();
        };
    }, [token]);

    const loading = state === null || state.token !== token;
    const data = state?.token === token ? state.data : null;
    const error = state?.token === token ? state.error : null;

    function reload() {
        setReloadToken((current) => current + 1);
    }

    return { data, error, loading, reload };
}

export function useReadiness(initialData: ReadinessResponse | null = null) {
    const [state, setState] =
        useState<RequestState<ReadinessResponse> | null>(
            initialData ? { token: 0, data: initialData, error: null } : null
        );
    const [reloadToken, setReloadToken] = useState(0);
    const hasInitialData = useRef(initialData !== null);
    const token = reloadToken;

    useEffect(() => {
        if (hasInitialData.current) {
            hasInitialData.current = false;
            return;
        }

        const controller = new AbortController();

        getReadiness({ signal: controller.signal })
            .then((readiness) => {
                setState({ token, data: readiness, error: null });
            })
            .catch((caught) => {
                if (!isAbortError(caught)) {
                    setState({
                        token,
                        data: null,
                        error: describeError(caught),
                    });
                }
            });

        return () => {
            controller.abort();
        };
    }, [token]);

    const loading = state === null || state.token !== token;
    const data = state?.token === token ? state.data : null;
    const error = state?.token === token ? state.error : null;

    function reload() {
        setReloadToken((current) => current + 1);
    }

    return { data, error, loading, reload };
}
