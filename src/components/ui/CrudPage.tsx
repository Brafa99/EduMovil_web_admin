import { useState, useEffect, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { DataTable, type Column } from './DataTable';
import { SearchInput } from './FormField';
import { Pagination } from './Pagination';

interface CrudPageProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  fetchData: (params: { search: string; page: number }) => Promise<{ data: T[]; total: number }>;
  keyExtractor: (row: T) => string;
  onAdd?: () => void;
  addLabel?: string;
  extraActions?: ReactNode;
  refreshTrigger?: number;
}

export function CrudPage<T>({
  title, description, columns, fetchData, keyExtractor,
  onAdd, addLabel = 'Nuevo', extraActions, refreshTrigger = 0,
}: CrudPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchData({ search, page }).then(res => {
      if (!cancelled) {
        setData(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [search, page, refreshTrigger]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-5 max-w-screen-2xl">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-3">
            {extraActions}
            {onAdd && (
              <button className="btn-primary" onClick={onAdd}>
                <Plus size={16} />
                {addLabel}
              </button>
            )}
          </div>
        }
      />
      <div className="card p-5">
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <DataTable columns={columns} data={data} loading={loading} keyExtractor={keyExtractor} />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
