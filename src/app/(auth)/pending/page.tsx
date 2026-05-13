export default function PendingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
          ⏳
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Compte en attente</h1>
        <p className="mt-4 text-gray-600">
          Votre compte a bien été créé. Il est actuellement en attente de validation par le
          Conseil Syndical.
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Vous recevrez un email dès que votre accès sera activé. Ce processus prend généralement
          1 à 2 jours ouvrés.
        </p>
        <div className="mt-6 rounded-xl bg-orange-50 p-4 text-sm text-orange-700">
          📧 Un email de confirmation vous sera envoyé à l&apos;adresse indiquée lors de votre
          inscription.
        </div>
      </div>
    </main>
  )
}
