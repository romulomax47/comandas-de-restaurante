alter table public.comandas
add column if not exists forma_pagamento text;
alter table public.comandas
add constraint comandas_forma_pagamento_check check (
      forma_pagamento is null
      or forma_pagamento in (
         'dinheiro',
         'pix',
         'credito',
         'debito',
         'voucher'
      )
   );