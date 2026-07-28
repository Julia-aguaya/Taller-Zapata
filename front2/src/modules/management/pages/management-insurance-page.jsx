import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { getInsuranceCatalogs } from '@/modules/cases/api/new-case-api';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';

export const ManagementInsurancePage = () => {
  const catalogsQuery = useQuery({
    queryKey: ['management', 'insurance', 'catalogs'],
    queryFn: getInsuranceCatalogs,
    retry: false,
  });

  const opinionCodes = catalogsQuery.data?.opinionCodes ?? [];
  const paymentStatusCodes = catalogsQuery.data?.paymentStatusCodes ?? [];

  return (
    <div className="space-y-5">
      <Card className="border-white/60 bg-card/95 p-5 shadow-haze sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gestión · Entidades</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Compañías de seguros</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              El contrato confirmado en front2 no expone un catálogo de aseguradoras. Solo existe `GET /insurance/catalogs`, usado por Carpetas para opiniones y estados de pago.
            </p>
          </div>
          <Badge variant="outline">Solo lectura parcial</Badge>
        </div>
      </Card>

      {catalogsQuery.isError ? (
        <EmptyState title="No pude consultar seguros" description={catalogsQuery.error.message} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <CatalogCard
            title="Opiniones disponibles"
            description="Catálogo real que hoy consume Carpetas. No representa compañías de seguros."
            items={opinionCodes}
          />
          <CatalogCard
            title="Estados de pago disponibles"
            description="Catálogo real que hoy consume Carpetas. No representa compañías de seguros."
            items={paymentStatusCodes}
          />
        </div>
      )}

      <EmptyState
        title="CRUD de compañías pendiente"
        description="No hay endpoints confirmados para listar compañías, ver detalle, crear, editar o desactivar aseguradoras. El faltante quedó documentado para backend."
      />
    </div>
  );
};

const CatalogCard = ({ title, description, items }) => (
  <Card className="border-white/60 bg-card/95 p-5 shadow-haze">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>

    {items.length === 0 ? (
      <p className="mt-4 text-sm text-muted-foreground">Este catálogo no devolvió valores.</p>
    ) : (
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item.code} variant="secondary">{item.name || item.code}</Badge>
        ))}
      </div>
    )}
  </Card>
);
