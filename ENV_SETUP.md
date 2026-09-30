# Environment Variables

Copy this to `.env.local` and fill in your values. **Never commit `.env.local` to git.**

## Arc Mainnet
```
NEXT_PUBLIC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_EXPLORER_URL=https://explorer.arc.io
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
```

## Deployed Contracts (fill after deploy)
```
NEXT_PUBLIC_CONTRACT_ADDRESS=         # Readlearc.sol
NEXT_PUBLIC_STREAM_PAY_ADDRESS=       # StreamPay.sol
NEXT_PUBLIC_CONTENT_REG_ADDRESS=      # ContentRegistry.sol
NEXT_PUBLIC_CREATOR_TIP_ADDRESS=      # CreatorTip.sol
NEXT_PUBLIC_TREASURY_ADDRESS=         # Platform treasury wallet
```

## Supabase
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Server-side recorder (for ContentRegistry writes)
A wallet funded with Arc USDC for gas. Keep private key secret.
```
RECORDER_PRIVATE_KEY=
```

## Video Storage
```
VIDEO_STORAGE_BUCKET=videos
VIDEO_STORAGE_BASE_URL=
```

## Optional
```
OPENROUTER_API_KEY=
```
