import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';

export const ManagementReferrersPage = () => (
  <div className="space-y-5">
    <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gestión · Personas y vehículos</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Referenciadores</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        El frontend actual solo confirma el flag `referenced`, un texto libre `referredByText` y un `referredByPersonId` siempre enviado como `null` al crear la carpeta.
      </p>
    </Card>

    <EmptyState
      title="Sin CRUD real confirmado"
      description="No existe en front2 un endpoint real para listar, consultar, crear o editar referenciadores. Por eso esta sección no muestra formularios falsos. El faltante quedó documentado para backend."
    />
  </div>
);
