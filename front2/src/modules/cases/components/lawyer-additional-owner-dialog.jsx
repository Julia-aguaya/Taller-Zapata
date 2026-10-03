import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LoaderCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { addCasePerson } from '@/modules/cases/api/third-party-api';
import { createPerson, searchPersons } from '@/modules/cases/api/new-case-api';
import { requestJson } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

const emptyPerson = { name: '', surname: '', dni: '', address: '' };
const personName = (person) => person.nombreMostrar || `${person.nombre || ''} ${person.apellido || ''}`.trim();

const createPhysicalPerson = async (person) => {
  const saved = await createPerson({ tipoPersona: 'fisica', nombre: person.name.trim(), apellido: person.surname.trim(), tipoDocumentoCodigo: 'DNI', numeroDocumento: person.dni.trim(), activo: true });
  await requestJson(`/persons/${saved.id}/addresses`, { method: 'POST', body: JSON.stringify({ tipoDomicilioCodigo: 'PARTICULAR', calle: person.address.trim(), numero: null, piso: null, depto: null, localidad: null, provincia: null, codigoPostal: null, paisCodigo: 'AR', principal: true }) });
  return saved;
};

export const LawyerAdditionalOwnerDialog = ({ caseId, vehicleId, remaining, open, onClose, onLinked }) => {
  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [newPerson, setNewPerson] = useState(emptyPerson);
  const [percentage, setPercentage] = useState('');
  const [error, setError] = useState('');
  const matches = useQuery({ queryKey: ['persons', 'lawyer-third-party-owner', search], queryFn: () => searchPersons({ q: search }), enabled: search.trim().length >= 2 });
  const linkOwner = useMutation({
    mutationFn: async () => {
      const requested = Number(percentage);
      if (!Number.isInteger(requested) || requested < 1 || requested > remaining) throw new Error(`El porcentaje debe estar entre 1 y ${remaining}.`);
      if (!selectedPerson && Object.values(newPerson).some((value) => !value.trim())) throw new Error('Buscá y seleccioná una persona o completá nombre, apellido, DNI y domicilio.');
      const person = selectedPerson ?? await createPhysicalPerson(newPerson);
      await addCasePerson(caseId, { personId: Number(person.id), caseRoleCode: 'TITULAR', vehicleId, isMain: false, notes: 'Titular registral tercero', porcentajeTitularidad: requested });
    },
    onSuccess: async () => {
      await onLinked();
      setSearch(''); setSelectedPerson(null); setNewPerson(emptyPerson); setPercentage(''); setError('');
      toast.success('Titular adicional incorporado.');
      onClose();
    },
    onError: (mutationError) => {
      const message = mutationError.message || 'No se pudo incorporar el titular.';
      setError(message);
      toast.error(message);
    },
  });
  const selectPerson = (person) => { setSelectedPerson(person); setNewPerson(emptyPerson); setError(''); };
  const changeNewPerson = (field, value) => { setSelectedPerson(null); setNewPerson((current) => ({ ...current, [field]: value })); setError(''); };
  const requested = Number(percentage);
  const invalidPercentage = percentage !== '' && (!Number.isInteger(requested) || requested < 1 || requested > remaining);

  return <Dialog open={open} onClose={onClose} title="Agregar otro titular" description={`Podés asignar entre 1 y ${remaining}% de titularidad.`} scrollable>
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium" htmlFor="lawyer-owner-search">Buscar persona existente</label>
        <Input id="lawyer-owner-search" className="mt-2" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedPerson(null); setError(''); }} placeholder="Nombre o documento" />
        {matches.isFetching ? <p className="mt-2 text-xs text-muted-foreground">Buscando personas…</p> : null}
        {(matches.data ?? []).map((person) => <button key={person.id} type="button" className="mt-2 block text-left text-sm text-primary underline-offset-4 hover:underline" onClick={() => selectPerson(person)}>{personName(person)}</button>)}
        {selectedPerson ? <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">Persona seleccionada: {personName(selectedPerson)}</p> : null}
      </div>
      <div className="border-t border-border/60 pt-5">
        <p className="text-sm font-medium">O creá una persona física nueva</p>
        <p className="mt-1 text-xs text-muted-foreground">Completá todos los datos para crearla y vincularla en un único paso.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input aria-label="Nombre nuevo titular" value={newPerson.name} onChange={(event) => changeNewPerson('name', event.target.value)} placeholder="Nombre" />
          <Input aria-label="Apellido nuevo titular" value={newPerson.surname} onChange={(event) => changeNewPerson('surname', event.target.value)} placeholder="Apellido" />
          <Input aria-label="DNI nuevo titular" value={newPerson.dni} onChange={(event) => changeNewPerson('dni', event.target.value)} placeholder="DNI" />
          <Input aria-label="Domicilio nuevo titular" value={newPerson.address} onChange={(event) => changeNewPerson('address', event.target.value)} placeholder="Domicilio" />
        </div>
      </div>
      <div className="border-t border-border/60 pt-5">
        <label className="block text-sm font-medium" htmlFor="lawyer-owner-percentage">Porcentaje de titularidad</label>
        <Input id="lawyer-owner-percentage" className="mt-2" type="number" min="1" max={remaining} value={percentage} onChange={(event) => { setPercentage(event.target.value); setError(''); }} />
        {invalidPercentage ? <p className="mt-2 text-xs text-destructive">El porcentaje debe estar entre 1 y {remaining}.</p> : null}
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={linkOwner.isPending}>Cancelar</Button>
        <Button type="button" onClick={() => linkOwner.mutate()} disabled={linkOwner.isPending || invalidPercentage}>{linkOwner.isPending ? <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}{linkOwner.isPending ? 'Incorporando…' : 'Agregar titular'}</Button>
      </div>
    </div>
  </Dialog>;
};
