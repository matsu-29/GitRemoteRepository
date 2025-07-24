"use client";

import { useSession } from "next-auth/react"
import { useState } from "react"

export default function Search() {
  const { data: session, status } = useSession()
  const [query, setQuery] = useState("")
  const [tracks, setTracks] = useState([])

  const handleSearch = async () => {
    if (status !== "authenticated") {
      alert("ログインしてください")
      return
    }
    if (!session?.accessToken) {
      alert("アクセストークンがありません")
      return
    }

    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!res.ok) {
      alert("Spotify APIの呼び出しに失敗しました")
      return
    }

    const data = await res.json()
    setTracks(data.tracks.items)
  }

  return (
    <div className="p-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="曲名を検索"
      />
      <button onClick={handleSearch}>検索</button>
      <ul>
        {tracks.map((track) => (
          <li key={track.id}>
            {track.name} - {track.artists[0].name}
          </li>
        ))}
      </ul>
    </div>
  )
}
