import { useEffect, useState } from "react";
import {
    describeError,
    getEntity,
    isAbortError,
} from "@/lib/api";
import type { GeoEntity, Resource } from "@/lib/types";

type EntityState = {
    key: string;
    entity: GeoEntity | null;
    error: string | null;
};

export function useEntity(resource: Resource, code: string | null) {
    const [state, setState] = useState<EntityState | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const key = code ? `${resource}:${code}:${reloadToken}` : "";

    useEffect(() => {
        if (!code) {
            return;
        }

        const controller = new AbortController();
        const requestKey = `${resource}:${code}:${reloadToken}`;

        getEntity(resource, code, { signal: controller.signal })
            .then((entity) => {
                setState({ key: requestKey, entity, error: null });
            })
            .catch((caught) => {
                if (!isAbortError(caught)) {
                    setState({
                        key: requestKey,
                        entity: null,
                        error: describeError(caught),
                    });
                }
            });

        return () => {
            controller.abort();
        };
    }, [resource, code, reloadToken]);

    const loading = Boolean(code) && (state === null || state.key !== key);
    const entity = code && state?.key === key ? state.entity : null;
    const error = code && state?.key === key ? state.error : null;

    function reload() {
        setReloadToken((current) => current + 1);
    }

    return { entity, error, loading, reload };
}
