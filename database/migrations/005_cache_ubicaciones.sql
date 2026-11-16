BEGIN;

-- Caché de búsquedas públicas de direcciones.
CREATE TABLE IF NOT EXISTS public.cache_ubicaciones (
    consulta_normalizada TEXT PRIMARY KEY,
    consulta_original VARCHAR(120) NOT NULL,
    resultados JSONB NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en TIMESTAMPTZ NOT NULL,

    CONSTRAINT chk_cache_ubicaciones_resultados
        CHECK (jsonb_typeof(resultados) = 'array'),

    CONSTRAINT chk_cache_ubicaciones_vencimiento
        CHECK (vence_en > creado_en)
);

CREATE INDEX IF NOT EXISTS idx_cache_ubicaciones_vence
    ON public.cache_ubicaciones (vence_en);

-- Control global de consultas a Nominatim.
CREATE TABLE IF NOT EXISTS public.control_consultas_ubicaciones (
    id SMALLINT PRIMARY KEY,
    proxima_consulta_en TIMESTAMPTZ NOT NULL,

    CONSTRAINT chk_control_consultas_ubicaciones_id
        CHECK (id = 1)
);

-- Una única fila compartida por todas las instancias de Work24.
INSERT INTO public.control_consultas_ubicaciones (
    id,
    proxima_consulta_en
)
VALUES (
    1,
    '-infinity'::TIMESTAMPTZ
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
