import LoginClient from './LoginClient'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const redirectedFrom = typeof resolvedSearchParams.redirectedFrom === 'string' 
    ? resolvedSearchParams.redirectedFrom 
    : '/dashboard'

  return (
    <LoginClient redirectedFrom={redirectedFrom} />
  )
}
