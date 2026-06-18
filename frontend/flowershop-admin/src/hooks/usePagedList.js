import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { cleanParams, readPagedResponse } from '../utils/format';

//Set limit trên page
export const LIST_LIMIT = 10;

export default function usePagedList(apiGetAll, filters, errorMessage, limit = LIST_LIMIT) {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const filterKey = JSON.stringify(filters);
//Load lại page khi có thay đổi
  async function load(nextPage = page) {
    setLoading(true);
    try {
      const res = await apiGetAll(cleanParams({ page: nextPage, limit, ...filters }));
      const data = readPagedResponse(res.data);
      setList(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages || Math.max(1, Math.ceil(data.total / limit)));
    } catch {
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, filterKey]);

  return { list, total, totalPages, page, setPage, loading, load };
}
