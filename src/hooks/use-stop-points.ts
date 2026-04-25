import { useQuery } from '@tanstack/react-query';
import { getStopPoints } from '@/actions';

export function useStopPoints(routeId?: string) {
  return useQuery({
    queryKey: ['stop-points', routeId],
    queryFn: () => getStopPoints(routeId!),
    enabled: !!routeId,
  });
}
