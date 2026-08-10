import { useEffect, useMemo, useState } from 'react';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  getDefaultWorkshops,
  readWorkshopCatalog,
  readWorkshopCatalogFromBackend,
  saveWorkshopCatalog,
  saveWorkshopCatalogToBackend,
} from '../../gestion/lib/workshopCatalog';
import {
  createAuthenticatedUser,
  readAuthenticatedBranches,
  readAuthenticatedOrganizations,
  readAuthenticatedRoles,
  readAuthenticatedUserRoles,
  readAuthenticatedUsers,
  updateAuthenticatedUserRoles,
} from '../../../lib/api/backend';

function emptyUserForm() {
  return {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    roleId: '',
    branchId: '',
  };
}

function isAdminRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return ['admin', 'administrador', 'administrator', 'superadmin'].includes(normalized);
}

function emptyWorkshopForm() {
  return {
    id: '',
    label: '',
    legalName: '',
    taxId: '',
    taxCondition: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
  };
}

export default function AdminManagementView({ backendSession }) {
  const accessToken = backendSession?.accessToken || '';
  const currentRole = backendSession?.user?.role || '';
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [screenState, setScreenState] = useState({ status: 'idle', message: '' });
  const [savingState, setSavingState] = useState({ users: false, message: '' });
  const [userForm, setUserForm] = useState(emptyUserForm());
  const [workshopForm, setWorkshopForm] = useState(emptyWorkshopForm());
  const [workshops, setWorkshops] = useState(() => readWorkshopCatalog());

  const branchOptions = useMemo(
    () => branches.map((branch) => ({ value: String(branch.id), label: `${branch.name} (${branch.code})` })),
    [branches],
  );
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: String(role.id), label: role.name })),
    [roles],
  );
  const loadWorkshops = async () => {
    if (!accessToken || !isAdminRole(currentRole)) {
      setWorkshops(readWorkshopCatalog());
      return;
    }

    try {
      const catalog = await readWorkshopCatalogFromBackend(accessToken);
      setWorkshops(catalog);
    } catch {
      setWorkshops(readWorkshopCatalog());
    }
  };

  const loadAdminData = async () => {
    if (!accessToken || !isAdminRole(currentRole)) {
      return;
    }

    setScreenState({ status: 'loading', message: '' });

    try {
      const [organizationsResult, branchesResult, rolesResult, usersResult] = await Promise.all([
        readAuthenticatedOrganizations(accessToken),
        readAuthenticatedBranches(accessToken),
        readAuthenticatedRoles(accessToken),
        readAuthenticatedUsers(accessToken),
      ]);

      const usersWithAssignments = await Promise.all(
        (Array.isArray(usersResult.data) ? usersResult.data : []).map(async (user) => {
          try {
            const assignmentsResult = await readAuthenticatedUserRoles(accessToken, user.id);
            const primaryAssignment = Array.isArray(assignmentsResult.data) ? assignmentsResult.data.find((item) => item.active) || assignmentsResult.data[0] : null;
            return {
              ...user,
              roleId: primaryAssignment?.roleId ? String(primaryAssignment.roleId) : '',
              organizationId: primaryAssignment?.organizationId ? String(primaryAssignment.organizationId) : '',
              branchId: primaryAssignment?.branchId ? String(primaryAssignment.branchId) : '',
            };
          } catch {
            return { ...user, roleId: '', organizationId: '', branchId: '' };
          }
        }),
      );

      setOrganizations(Array.isArray(organizationsResult.data) ? organizationsResult.data : []);
      setBranches(Array.isArray(branchesResult.data) ? branchesResult.data : []);
      setRoles(Array.isArray(rolesResult.data) ? rolesResult.data : []);
      setUsers(usersWithAssignments);
      setScreenState({ status: 'success', message: '' });
    } catch (error) {
      setScreenState({ status: 'error', message: error?.message || 'No pudimos cargar la gestión administrativa.' });
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [accessToken, currentRole]);

  useEffect(() => {
    void loadWorkshops();
  }, [accessToken, currentRole]);

  const handleCreateUser = async () => {
    const selectedBranch = branches.find((branch) => String(branch.id) === String(userForm.branchId));
    if (!selectedBranch || !userForm.roleId || !userForm.firstName || !userForm.username || !userForm.email || !userForm.password) {
      setSavingState({ users: false, message: 'Completá nombre, username, email, password, rol y sucursal.' });
      return;
    }

    setSavingState({ users: true, message: '' });
    try {
      await createAuthenticatedUser(accessToken, {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        roleId: Number(userForm.roleId),
        organizationId: selectedBranch.organizationId,
        branchId: Number(userForm.branchId),
        active: true,
      });
      setUserForm(emptyUserForm());
      await loadAdminData();
      setSavingState({ users: false, message: 'Usuario creado correctamente.' });
    } catch (error) {
      setSavingState({ users: false, message: error?.message || 'No pudimos crear el usuario.' });
    }
  };

  const handleUpdateUserScope = async (user) => {
    const selectedBranch = branches.find((branch) => String(branch.id) === String(user.branchId));
    if (!selectedBranch || !user.roleId) {
      setSavingState({ users: false, message: 'Seleccioná rol y sucursal para guardar.' });
      return;
    }

    setSavingState({ users: true, message: '' });
    try {
      await updateAuthenticatedUserRoles(accessToken, user.id, {
        assignments: [
          {
            roleId: Number(user.roleId),
            organizationId: selectedBranch.organizationId,
            branchId: Number(user.branchId),
            active: true,
          },
        ],
      });
      await loadAdminData();
      setSavingState({ users: false, message: 'Sucursal del usuario actualizada.' });
    } catch (error) {
      setSavingState({ users: false, message: error?.message || 'No pudimos actualizar el usuario.' });
    }
  };

  const handleSaveWorkshop = async () => {
    if (!workshopForm.id) {
      setSavingState({ users: false, message: 'Seleccioná primero qué taller querés editar.' });
      return;
    }

    if (!workshopForm.label.trim()) {
      setSavingState({ users: false, message: 'El nombre visible del taller es obligatorio.' });
      return;
    }

    const nextWorkshops = workshops.map((workshop) => (
      workshop.id === workshopForm.id
        ? {
          ...workshop,
          label: workshopForm.label,
          legalName: workshopForm.legalName,
          taxId: workshopForm.taxId,
          taxCondition: workshopForm.taxCondition,
          address: workshopForm.address,
          phone: workshopForm.phone,
          email: workshopForm.email,
          logo: workshopForm.logo,
        }
        : workshop
    ));

    setSavingState({ users: false, message: '' });

    try {
      const savedCatalog = accessToken && isAdminRole(currentRole)
        ? await saveWorkshopCatalogToBackend(accessToken, nextWorkshops)
        : saveWorkshopCatalog(nextWorkshops);

      setWorkshops(savedCatalog);
      setWorkshopForm(emptyWorkshopForm());
      setSavingState({ users: false, message: 'Datos del taller guardados para la plantilla de presupuesto.' });
    } catch (error) {
      setSavingState({ users: false, message: error?.message || 'No pudimos guardar los datos del taller.' });
    }
  };

  const handleResetWorkshops = () => {
    const defaults = getDefaultWorkshops();
    setWorkshops(saveWorkshopCatalog(defaults));
    setWorkshopForm(emptyWorkshopForm());
    setSavingState({ users: false, message: 'Se restauró el catálogo original de talleres.' });
  };

  if (!isAdminRole(currentRole)) {
    return (
      <div className="page-stack">
        <section className="card backend-cases-empty">
          <strong>Sin acceso administrativo.</strong>
          <p>Esta sección está reservada para administradores.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero">
        <div className="stack-tight">
          <p className="eyebrow">Gestión</p>
          <h1>Administración de usuarios y talleres</h1>
          <p className="muted">Asigná usuarios a sucursales y mantené los catálogos generales reutilizables en Nuevo caso y Presupuesto.</p>
        </div>
        <div className="tag-row">
          <StatusBadge tone="info">Solo admin</StatusBadge>
          {organizations.length ? <StatusBadge tone="success">{organizations.length} organización(es)</StatusBadge> : null}
        </div>
      </section>

      {screenState.status === 'error' ? <div className="alert-banner danger-banner">{screenState.message}</div> : null}
      {savingState.message ? <div className="alert-banner info-banner">{savingState.message}</div> : null}

      <section className="card simple-panel-section">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Talleres</p>
            <h2>Cabecera de presupuesto</h2>
          </div>
          <StatusBadge tone="info">{workshops.length} taller(es)</StatusBadge>
        </div>

        <div className="form-grid three-columns">
          <SelectField
            label="Taller"
            onChange={(value) => {
              const selectedWorkshop = workshops.find((workshop) => workshop.id === value);
              setWorkshopForm(selectedWorkshop ? { ...selectedWorkshop } : emptyWorkshopForm());
            }}
            options={workshops.map((workshop) => ({ value: workshop.id, label: workshop.label }))}
            placeholder="Seleccioná"
            value={workshopForm.id}
          />
          <DataField label="Nombre visible" onChange={(value) => setWorkshopForm((current) => ({ ...current, label: value }))} value={workshopForm.label} />
          <DataField label="Razón social" onChange={(value) => setWorkshopForm((current) => ({ ...current, legalName: value }))} value={workshopForm.legalName} />
          <DataField label="CUIT" onChange={(value) => setWorkshopForm((current) => ({ ...current, taxId: value }))} value={workshopForm.taxId} />
          <DataField label="Condición impositiva" onChange={(value) => setWorkshopForm((current) => ({ ...current, taxCondition: value }))} value={workshopForm.taxCondition} />
          <DataField label="Dirección" onChange={(value) => setWorkshopForm((current) => ({ ...current, address: value }))} value={workshopForm.address} />
          <DataField label="Teléfono" onChange={(value) => setWorkshopForm((current) => ({ ...current, phone: value }))} value={workshopForm.phone} />
          <DataField label="Mail" onChange={(value) => setWorkshopForm((current) => ({ ...current, email: value }))} value={workshopForm.email} />
          <DataField label="Logo URL" onChange={(value) => setWorkshopForm((current) => ({ ...current, logo: value }))} value={workshopForm.logo} />
        </div>

        <div className="actions-row">
          <button className="primary-button" onClick={handleSaveWorkshop} type="button">Guardar taller</button>
          <button className="ghost-button" onClick={handleResetWorkshops} type="button">Restaurar catálogo</button>
        </div>

        <div className="notification-list">
          {workshops.map((item) => (
            <article className="notification-card" key={item.id}>
              <div className="stack-tight">
                <strong>{item.label}</strong>
                <small>{item.legalName || 'Razón social pendiente'}</small>
                <small>{[item.taxId, item.taxCondition].filter(Boolean).join(' · ') || 'CUIT y condición impositiva pendientes'}</small>
                <small>{[item.address, item.phone, item.email].filter(Boolean).join(' · ') || 'Contacto pendiente'}</small>
              </div>
              <div className="notification-card-actions">
                <button className="secondary-button compact-button" onClick={() => setWorkshopForm({ ...item })} type="button">Editar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card simple-panel-section">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Usuarios por sucursal</p>
            <h2>Alta y asignación</h2>
          </div>
          <StatusBadge tone="info">{users.length} usuario(s)</StatusBadge>
        </div>

        <div className="form-grid three-columns">
          <DataField label="Nombre" onChange={(value) => setUserForm((current) => ({ ...current, firstName: value }))} value={userForm.firstName} />
          <DataField label="Apellido" onChange={(value) => setUserForm((current) => ({ ...current, lastName: value }))} value={userForm.lastName} />
          <DataField label="Username" onChange={(value) => setUserForm((current) => ({ ...current, username: value }))} value={userForm.username} />
          <DataField label="Email" onChange={(value) => setUserForm((current) => ({ ...current, email: value }))} value={userForm.email} />
          <DataField label="Password" onChange={(value) => setUserForm((current) => ({ ...current, password: value }))} value={userForm.password} type="password" />
          <SelectField label="Rol" onChange={(value) => setUserForm((current) => ({ ...current, roleId: value }))} options={roleOptions} placeholder="Seleccioná" value={userForm.roleId} />
          <SelectField label="Sucursal" onChange={(value) => setUserForm((current) => ({ ...current, branchId: value }))} options={branchOptions} placeholder="Seleccioná" value={userForm.branchId} />
        </div>

        <div className="actions-row">
          <button className="primary-button" disabled={savingState.users} onClick={() => { void handleCreateUser(); }} type="button">Crear usuario</button>
        </div>

        <div className="table-wrap">
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Sucursal</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <select onChange={(event) => setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, roleId: event.target.value } : item)))} value={user.roleId}>
                      <option value="">Seleccioná</option>
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select onChange={(event) => setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, branchId: event.target.value } : item)))} value={user.branchId}>
                      <option value="">Seleccioná</option>
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </td>
                  <td><button className="secondary-button compact-button" disabled={savingState.users} onClick={() => { void handleUpdateUserScope(user); }} type="button">Guardar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
