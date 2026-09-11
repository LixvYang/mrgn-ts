/**
 * 已知的 marginfi 账户映射：group -> authority -> marginfiAccount[]
 *
 * 为什么存在：marginfi 账户不是 PDA，按 authority 反查只能用 getProgramAccounts +
 * memcmp，而当前配置的 RPC 拒绝索引类请求（publicnode 返回
 * -32602 "Indexed requests require a personal token"），导致 fetchMarginfiAccountAddresses
 * 必然抛错。这张表是临时兜底，换成支持 getProgramAccounts 的 RPC 后即可删除。
 *
 * 快照时间：2026-09-11，来源：getProgramAccounts(dataSize=2312, group@8)，共 26 个账户。
 * 新用户开仓后不会出现在这里，必须依赖真实 RPC。
 */
export const KNOWN_MARGINFI_ACCOUNTS: Record<string, Record<string, string[]>> = {
  // Mixin Computer group
  "4X38G7YHpS1jjc7hAKvT2dzcGuTCaZfhyDx56Qs9Tk51": {
    "28iepK4nY7cZAvAk7YvXDf3LfCGPpHecysQ8Jc9YnRzy": ["EjdcJWgbkSMBDrqScgY6Yy9rf73wvnzoKvP5cCaPEtTx"],
    "2LQbfjqGn7paKFTDRPnu68VkgrMZ2JUEXm8PVYgNf8Rh": ["5KLt7EGoEbiQTacjrngb41SskRudP4b57rCuge1ofvrE"],
    "2hSmfxnNbstRytCXAmMVC6fhVTcndEv5TxT8PHcNVV6r": ["35Vp8daRNfk1BfTos6FaKkg5T6MjgbJ6nZuBp3w2KBdt"],
    "2hgBx5VmemX3NT9mFf5r1jPpACWPEQBPwnBLafreobkU": ["9B2MmmTWPL22Aqy3KiLE5tQ7jfnPCZePC3GwoGYGKzvB"],
    "41YxNfLpCkCgqCXgUm8wzmib2LudWUfxth92qFab5g6K": ["HBQB9rSuSxP2fF8z6ZYAFsQNRpQqJaCabv6inSkKE7c1"],
    "4A7UsoWnyGmh3Yhb3r6Lo6tRKbKMFfyW1X98KL1CrTtV": ["9rf89AJGpNMfbuGYucpV2u3ipegHuGAPbmjzCbshpppx"],
    "4fNXp75AGfQ4BKWsSQeDatidzYxFBK3SsdMGGnQSii9a": ["5EGBnMswAq3F3YSLZHZBkVoGEWAiWs7m8g8RxiVw85pi"],
    "6499XbqtZiSvcec7g4sLY6nFtNpFpcdDn7xyrcBqHqHF": ["6eY5dY25kSeN7VzwCYXvs93FnzaKrT2pmLrEvKc1TE6a"],
    "6FwMMHYzNZ6L8C7jd7r4rycb4p4HR7G7dQ35fBTgX8Wu": ["3bPXoCi5WvqhDGCTKfzubciAAdvAqfeTV4qoktMYEZBe"],
    "6YZnjinERbmn42WvXrPnkVXPoPJVMbEWrBtc1o2jBDjD": ["FLVtjBFVfQCRv2qTMenWyM9mYeABDRyenJ2nBYpfdp7c"],
    "72x3zjRxDMdpMDtzzHRTKrf9Hu6unWqfhHGbAf2N4LpK": ["FuLtA4BtD8r6ZqoqxAYarSoCtGCSs5HD5JegYG9P9FxU"],
    "7TGifDqbyhgWKid8pTxkbRjwa8sLZjmVbziZD3HwdcWm": ["CaSMdFraxC2Ay3pN2Eis1mKyBj8nXxDPu2UhkCqxi97s"],
    "8k84zS3JfdKPJ8sKf58XpfgFwp25VVC7uTJYBCWLR4Q2": ["1igJdYV2SM2pAsDCAfh1i6EDjtKXEMgwgATo6H5xHRo"],
    "9odMjftR1FHQ3wsrhKpHzszmrQ8V6Um94C5nFpvfQfn": ["Bz7x1jUn4h3sShzYWVk6vDTqyZVRJGBDCnp8pGDZH3Tc"],
    "Bg8FWQCSB7nwHS6RKamhBJwSkUaPYdfBJo6ZN75MZieW": ["4hNPvCrjeviuZ9BtVeA2187MygoQoaZUPDsZ7neNLQpJ"],
    "Bx7m7v1aY15Dt26NYNwcvby4E9fqdbPG5iCuZ3KZrZFC": ["Dh2DFr8qy7T4c8wWNtSDwXgDVDWURowaFz27k3rA7iz4"],
    "DRWxoyZbXaJvxQDH8JqiEKVvvQmmTnGpaarSo1HrCsam": ["Ed2CWRkeHxArTd4C2g7QPbBbx5Bs58JdFyQMewZbx9mM"],
    "DnpeSizw2obsEnDUe9tdTKPvuUMvEKFn7xfu7QGJBppn": ["Fh2xgsstK4d9d4qJZUWprYKqYszKsc9LPxtjKJzrU8TF"],
    "ETkp1QWxTf5eYDt9BXnsgsnTFh69V5MuF9HPnu65B7Yx": ["C55Ha3jdZeGkrJXFJhYX4UDyqRFN9qSpFctSa9cPXdf9"],
    "EjJ7phzajnux5H9EwpY2VnXbYXor6TbNc2otqUDqXHQW": ["858rt1yXGRraVYyrCwq8HQAQy6Zr4HMAKuK2xADLBo9C"],
    "Eyg91Sc3kWr1arHoLgRJEzqVyRncRKzA2tEWNwf62bxr": ["5RXzzn9aEXJWG3keVaMMF67bNCcVzqPczeZYVe3cQbbW"],
    "F8e4tEGP8Sbs8CdEKHm811uaEuvFfhzyGYnmneVExkBL": ["749x2KRUythUbuMNK8XQYdNqFReqdgPoMm9w3zR1ZMQ7"],
    "HFfNEuYmAhojKDgBzBjEdoRmQaEa9EfgUHr4jJ9mgqWD": ["4N9kmedxC34yDriNRgRziegAKWcdvFrcQMJtHPattRe9"],
    "HKRMHPP5W8RDXUoFGCQvmP7tbzgtdRNhJMsjHGUdsWHs": ["FRTZksy9GZUVjMUpRM58A74wo2iU9q4MPhYr3BVDUAyP"],
    "ixXFdyrdMr8L1yeRzq1jGqBxnmeHHcLs2gxbqodh3vq": ["5g9ufkW6EPEmA1aWV5sDds2fAerKEaya9MMwY84HtuMG"],
    "v9bwDECEeSehhfZitgJpwwkVbdSiy88PL6qDrvjVZHd": ["Dov1TRRir21rMoyGRFrBvb57WNS2CKRQPJuuNw9sfsSG"],

    // 沿用原路由里的硬编码条目。注意该账户已不在链上：2026-07-15 被管理员在
    // 28Bo9XdQHSRG14NJ2ymg5W9DZpiojrGM4aTP9RXxtXfeA3ui9fhY2Q358MRUw7MqD3stJdenpk7JsazQ25Wasqfs
    // 中用 AdminCloseAccount 关闭（同批关了 16 个），lamports 16982400 -> 0，
    // 且该 authority 名下当前没有任何 marginfi 账户。返回它会让前端去读一个不存在的账户。
    "J7V72Ap7pfxT3SDPwCYu2Cjvg7Put79Dix45BwQUeFeW": ["7g1RboWwS2cTVEaiDWYes7DBQBbeJSUCRJihH6rZTP5r"],
  },
};

export function lookupKnownMarginfiAccounts(group: string, authority: string): string[] | undefined {
  return KNOWN_MARGINFI_ACCOUNTS[group]?.[authority];
}
