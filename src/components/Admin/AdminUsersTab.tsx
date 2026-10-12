import { Search } from 'lucide-react';
import type { UserItem } from './admin.types';

interface AdminUsersTabProps {
  users: UserItem[];
  filteredUsers: UserItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSuperAdmin: boolean;
  onUpdateRole: (userId: string, role: string) => void;
  isPendingRoleUpdate: boolean;
}

export function AdminUsersTab({
  users,
  filteredUsers,
  searchQuery,
  onSearchChange,
  isSuperAdmin,
  onUpdateRole,
  isPendingRoleUpdate,
}: AdminUsersTabProps) {
  return (
    <div className="surface rounded-2xl border overflow-hidden space-y-4">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search users by name, email or role..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
              <th className="py-3 px-4 text-left">User</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-center">Students Managed</th>
              <th className="py-3 px-4 text-center">Calls Made</th>
              <th className="py-3 px-4 text-left">Last Call Date</th>
              {isSuperAdmin && <th className="py-3 px-4 text-right">Role Management</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredUsers.map((u) => {
              const isThisSuperAdmin =
                u.email.toLowerCase() === 'ismailjosim99@gmail.com' || u.role === 'super_admin';

              return (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-foreground text-xs">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isThisSuperAdmin
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : u.role === 'admin'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {isThisSuperAdmin ? 'Super Admin' : u.role || 'User'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">
                    {u.studentsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">
                    {u.callsCount}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {u.lastCallDate
                      ? new Date(u.lastCallDate).toLocaleDateString()
                      : 'No calls yet'}
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      {u.email.toLowerCase() === 'ismailjosim99@gmail.com' ? (
                        <span className="text-[11px] text-muted-foreground font-semibold italic">
                          Permanent Super Admin
                        </span>
                      ) : (
                        <select
                          value={u.role || 'user'}
                          disabled={isPendingRoleUpdate}
                          onChange={(e) => onUpdateRole(u.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border bg-background font-semibold cursor-pointer"
                        >
                          <option value="user">User / Mentor</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
