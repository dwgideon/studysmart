import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DebugPage({ session }) {
  useEffect(() => {
    const testInsert = async () => {
      const userId = session?.user?.id;
      console.log("DEBUG SESSION:", session);

      const { data, error } = await supabase
        .from('debug_table')
        .insert([
          {
            id: crypto.randomUUID(),
            title: 'Test Insert',
            user_id: userId
          }
        ]);

      console.log("DEBUG INSERT RESULT:", { data, error });
    };

    if (session?.user?.id) testInsert();
  }, [session]);

  return <div className="p-6 text-xl">Testing insert…</div>;
}

