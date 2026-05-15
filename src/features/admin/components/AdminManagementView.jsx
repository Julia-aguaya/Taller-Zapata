import { useEffect, useMemo, useState } from 'react';
import DataField from '../../../components/ui/DataField';
import SelectField from '../../../components/ui/SelectField';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
  createAuthenticatedReferralContact,
  createAuthenticatedUser,
  readAuthenticatedBranches,
  readAuthenticatedOrganizations,
  readAuthenticatedReferralContacts,
  readAuthenticatedRoles,
  readAuthenticatedUserRoles,
  readAuthenticatedUsers,
  updateAuthenticatedReferralContact,
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

function emptyReferralForm() {
  return {
    id: null,
    name: '',
    phone: '',
    email: '',
    notes: '',
  };
}

function isAdminRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return ['admin', 'administrador', 'administrator', 'superadmin'].includes(normalized);
}

export default function AdminManagementView({ backendSession }) {
  const accessToken = backendSession?.accessToken || '';
  const currentRole = backendSession?.user?.role || '';
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [referralContacts, setReferralContacts] = useState([]);
  const [screenState, setScreenState] = useState({ status: 'idle', message: '' });
  const [savingState, setSavingState] = useState({ users: false, referrals: false, message: '' });
  const [userForm, setUserForm] = useState(emptyUserForm());
  const [referralForm, setReferralForm] = useState(emptyReferralForm());
  const [referralSearch, setReferralSearch] = useState('');

  const branchOptions = useMemo(
    () => branches.map((branch) => ({ value: String(branch.id), label: `${branch.name} (${branch.code})` })),
    [branches],
  );
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: String(role.id), label: role.name })),
    [roles],
  );
  const filteredReferrals = useMemo(() => {
    const search = referralSearch.trim().toLowerCase();
    if (!search) return referralContacts;
    return referralContacts.filter((item) => [item.name, item.email, item.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(search)));
  }, [referralContacts, referralSearch]);

  const loadAdminData = async () => {
    if (!accessToken || !isAdminRole(currentRole)) {
      return;
    }

    setScreenState({ status: 'loading', message: '' });

    try {
      const [organizationsResult, branchesResult, rolesResult, usersResult, referralsResult] = await Promise.all([
        readAuthenticatedOrganizations(accessToken),
        readAuthenticatedBranches(accessToken),
        readAuthenticatedRoles(accessToken),
        readAuthenticatedUsers(accessToken),
        readAuthenticatedReferralContacts(accessToken),
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
      setReferralContacts(Array.isArray(referralsResult.data) ? referralsResult.data : []);
      setScreenState({ status: 'success', message: '' });
    } catch (error) {
      setScreenState({ status: 'error', message: error?.message || 'No pudimos cargar la gestión administrativa.' });
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [accessToken, currentRole]);

  const handleCreateUser = async () => {
    const selectedBranch = branches.find((branch) => String(branch.id) === String(userForm.branchId));
    if (!selectedBranch || !userForm.roleId || !userForm.firstName || !userForm.username || !userForm.email || !userForm.password) {
      setSavingState({ users: false, referrals: false, message: 'Completá nombre, username, email, password, rol y sucursal.' });
      return;
    }

    setSavingState({ users: true, referrals: false, message: '' });
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
      setSavingState({ users: false, referrals: false, message: 'Usuario creado correctamente.' });
    } catch (error) {
      setSavingState({ users: false, referrals: false, message: error?.message || 'No pudimos crear el usuario.' });
    }
  };

  const handleUpdateUserScope = async (user) => {
    const selectedBranch = branches.find((branch) => String(branch.id) === String(user.branchId));
    if (!selectedBranch || !user.roleId) {
      setSavingState({ users: false, referrals: false, message: 'Seleccioná rol y sucursal para guardar.' });
      return;
    }

    setSavingState({ users: true, referrals: false, message: '' });
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
      setSavingState({ users: false, referrals: false, message: 'Sucursal del usuario actualizada.' });
    } catch (error) {
      setSavingState({ users: false, referrals: false, message: error?.message || 'No pudimos actualizar el usuario.' });
    }
  };

  const handleSaveReferral = async () => {
    if (!referralForm.name.trim()) {
      setSavingState({ users: false, referrals: false, message: 'El nombre del referenciado es obligatorio.' });
      return;
    }

    setSavingState({ users: false, referrals: true, message: '' });
    try {
      if (referralForm.id) {
        await updateAuthenticatedReferralContact(accessToken, referralForm.id, {
          name: referralForm.name,
          phone: referralForm.phone,
          email: referralForm.email,
          notes: referralForm.notes,
          active: true,
        });
      } else {
        await createAuthenticatedReferralContact(accessToken, {
          name: referralForm.name,
          phone: referralForm.phone,
          email: referralForm.email,
          notes: referralForm.notes,
          active: true,
        });
      }
      setReferralForm(emptyReferralForm());
      await loadAdminData();
      setSavingState({ users: false, referrals: false, message: 'Referenciado guardado correctamente.' });
    } catch (error) {
      setSavingState({ users: false, referrals: false, message: error?.message || 'No pudimos guardar el referenciado.' });
    }
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
          <h1>Administración de usuarios y referenciados</h1>
          <p className="muted">Asigná usuarios a sucursales y mantené el catálogo general de referenciados reutilizable en Nuevo caso.</p>
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

      <section className="card simple-panel-section">
        <div className="section-head small-gap">
          <div>
            <p className="eyebrow">Referenciados</p>
            <h2>Catálogo general</h2>
          </div>
          <StatusBadge tone="info">{referralContacts.length} cargado(s)</StatusBadge>
        </div>

        <div className="form-grid three-columns">
          <DataField label="Nombre" onChange={(value) => setReferralForm((current) => ({ ...current, name: value }))} value={referralForm.name} />
          <DataField label="Teléfono" onChange={(value) => setReferralForm((current) => ({ ...current, phone: value }))} value={referralForm.phone} />
          <DataField label="Mail" onChange={(value) => setReferralForm((current) => ({ ...current, email: value }))} value={referralForm.email} />
        </div>
        <label className="field">
          <span>Observaciones</span>
          <textarea onChange={(event) => setReferralForm((current) => ({ ...current, notes: event.target.value }))} value={referralForm.notes} />
        </label>
        <div className="actions-row">
          <button className="primary-button" disabled={savingState.referrals} onClick={() => { void handleSaveReferral(); }} type="button">{referralForm.id ? 'Actualizar referenciado' : 'Agregar referenciado'}</button>
          {referralForm.id ? <button className="ghost-button" onClick={() => setReferralForm(emptyReferralForm())} type="button">Cancelar edición</button> : null}
        </div>

        <div className="lookup-form">
          <DataField label="Buscar referenciado" onChange={setReferralSearch} value={referralSearch} />
        </div>

        <div className="notification-list">
          {filteredReferrals.map((item) => (
            <article className="notification-card" key={item.id}>
              <div className="stack-tight">
                <strong>{item.name}</strong>
                <small>{item.phone || 'Sin teléfono'} · {item.email || 'Sin mail'}</small>
                {item.notes ? <small>{item.notes}</small> : null}
              </div>
              <div className="notification-card-actions">
                <button className="secondary-button compact-button" onClick={() => setReferralForm({ id: item.id, name: item.name || '', phone: item.phone || '', email: item.email || '', notes: item.notes || '' })} type="button">Editar</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
