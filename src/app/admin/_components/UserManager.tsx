'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  ShieldAlert,
  Shield,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  KeyRound,
} from 'lucide-react';
import { AdminUser, UserRole } from '@/lib/types';

interface UserManagerProps {
  users: AdminUser[];
  currentUserId: string;
  onNewUser: () => void;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (id: string, nombre: string) => void;
  onToggleStatus: (user: AdminUser) => void;
}

export function UserManager({
  users,
  currentUserId,
  onNewUser,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
}: UserManagerProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-rojo-dark border border-red-200">
            <ShieldAlert size={12} />
            Administrador
          </span>
        );
      case 'EDITOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
            <Shield size={12} />
            Editor
          </span>
        );
      case 'LECTOR':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Eye size={12} />
            Lector
          </span>
        );
    }
  };

  const formatDate = (dateVal?: string | Date) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-primary flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center">
              <Users size={20} />
            </div>
            <span>Gestión de Usuarios y Roles</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-soft border border-border text-text-muted">
              {users.length}
            </span>
          </h2>
          <p className="text-xs text-text-secondary mt-1.5 max-w-2xl">
            Controla quiénes tienen acceso al panel de administración del portal turístico de Cumpeo. Asigna roles de Administrador, Editor o Lector según las responsabilidades de cada funcionario.
          </p>
        </div>

        <button
          onClick={onNewUser}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rojo hover:bg-rojo-dark text-white transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-soft rounded-lg border border-border focus:outline-none focus:border-rojo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-muted">Filtrar rol:</span>
          <select
            className="text-xs bg-surface-soft border border-border rounded-lg px-2.5 py-1.5 text-text-secondary focus:outline-none focus:border-rojo"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="ADMIN">Administradores</option>
            <option value="EDITOR">Editores</option>
            <option value="LECTOR">Lectores</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#FAF8F5]/80 text-[11px] font-extrabold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha Creación</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-text-muted text-xs">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="hover:bg-[#FAF8F5]/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rojo/10 text-rojo font-bold text-xs flex items-center justify-center shrink-0 border border-rojo/20">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-text-primary flex items-center gap-1.5 truncate">
                              <span>{user.nombre}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rojo/10 text-rojo">
                                  Tú
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-text-secondary">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Mail size={12} className="text-text-muted shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.activo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={12} />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                              <XCircle size={12} />
                              Desactivado
                            </span>
                          )}
                          {user.mustChangePassword && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                              title="Todavía no cambia la contraseña temporal que se le asignó"
                            >
                              <KeyRound size={12} />
                              Clave pendiente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created date */}
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-text-muted/70" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Active */}
                          <button
                            onClick={() => onToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.activo
                                ? 'text-text-muted hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={user.activo ? 'Desactivar acceso' : 'Reactivar acceso'}
                            disabled={isCurrent && user.role === 'ADMIN'}
                          >
                            {user.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditUser(user)}
                            className="p-1.5 text-cielo hover:bg-sky-50 rounded-lg transition-colors"
                            title="Editar usuario o contraseña"
                          >
                            <Pencil size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteUser(user.id, user.nombre)}
                            className="p-1.5 text-rojo hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                            disabled={isCurrent}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
