import { redirect } from 'next/navigation';

/** The live map now lives on the Fleet overview. */
export default function MapPage() {
  redirect('/');
}
