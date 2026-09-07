<script setup lang="ts">
defineProps<{ destination: string }>()
</script>
<template>
  <svg
    v-if="destination === 'SIN'"
    viewBox="0 0 480 270"
    role="img"
    aria-label="Illustration of Singapore's Marina Bay skyline"
    preserveAspectRatio="xMidYMid slice"
  >
    <rect width="480" height="270" fill="#d9e7e3" />
    <circle cx="375" cy="66" r="34" fill="#f8e5b9" />
    <path
      d="M0 168 35 147h24v-33h26v50h19V95h31v69h21V81h24v83h31v-43h21v52h28v-44h27v42h46v-57h24v50h35l34-36h34v59H0Z"
      fill="#91b3af"
    />
    <rect y="197" width="480" height="73" fill="#89b2b1" />
    <path
      d="M0 222c97-17 151 13 245 2s151-4 235 3M0 250c85-11 153 6 257-2s151-5 223 1"
      stroke="#b5d1c9"
      fill="none"
    />
    <path
      d="m247 181 6-85h21l7 85m19 0 4-85h22l5 85m17 0 6-85h22l6 85"
      fill="#eceade"
      stroke="#5f8a8c"
      stroke-width="2"
    />
    <path d="m235 91 151-7-12 17-119 6Z" fill="#436a6c" />
    <path
      d="M260 111v63m8-64 5 64m38-64-3 64m10-64 5 64m40-66-6 66m14-66 4 66"
      stroke="#8badab"
      stroke-width="2"
    />
    <path
      d="M37 200v-47m0 24-18-15m18 7 21-18m-21 10-13-17m13 10 10-16M85 200v-29m0 8-15-13m15 6 15-16"
      stroke="#3d7069"
      stroke-width="5"
    />
    <path
      d="M117 205c-6-22 1-30 13-32-2-15 7-20 17-15 14-6 23 4 19 15 13 9 10 27-1 32"
      fill="#558577"
    />
    <path d="M0 207h480" stroke="#3d7069" stroke-width="4" />
  </svg>
  <svg
    v-else-if="destination === 'DPS'"
    viewBox="0 0 480 270"
    role="img"
    aria-label="Illustration of Balinese temples and tropical hills"
    preserveAspectRatio="xMidYMid slice"
  >
    <rect width="480" height="270" fill="#e7e8d3" />
    <circle cx="368" cy="60" r="32" fill="#efd69f" />
    <path d="M0 143 118 48l115 126 95-93 152 83v106H0Z" fill="#a6b59a" />
    <path d="M0 188 116 106l103 91 75-57 186 57v73H0Z" fill="#7a9b7b" />
    <path d="M0 223c151-61 183 18 295-24s141-2 185-2v73H0Z" fill="#547d67" />
    <path
      d="M0 254c144-65 212 29 349-27s114-8 131-6"
      stroke="#a4b98a"
      stroke-width="10"
      fill="none"
    />
    <path d="M284 229v-89h41v89" fill="#474f44" />
    <path
      d="m261 211 44-28 44 28Zm4-28 40-29 40 29Zm7-29 33-27 33 27Zm5-25 28-30 28 30Zm7-26 21-30 21 30Z"
      fill="#343f37"
    />
    <path d="M305 71V59" stroke="#343f37" stroke-width="3" />
    <path d="M103 263c8-46 4-98-16-142" stroke="#4c6150" stroke-width="8" />
    <path
      d="M89 127c-33-4-49 8-63 30 21-9 44-15 63-17-18-15-20-36-16-60 5 16 13 28 22 37 14-18 29-25 54-23-20 10-32 20-47 36 25-3 47 6 62 25-30-10-50-16-63-15"
      fill="#365e4b"
    />
  </svg>
  <svg
    v-else
    viewBox="0 0 480 270"
    role="img"
    aria-label="Illustration of Bangkok's golden temples at sunset"
    preserveAspectRatio="xMidYMid slice"
  >
    <rect width="480" height="270" fill="#edddd1" />
    <circle cx="103" cy="68" r="34" fill="#e8b27f" />
    <path
      d="M0 172h34v-57h19v57h18v-76h32v76h27v-50h35v50h27v-43h19v43h29v-64h28v64h52v-85h28v85h26v-51h22v51h33v-35h22v35h29v98H0Z"
      fill="#cbb1a3"
    />
    <rect y="216" width="480" height="54" fill="#b6b7a6" />
    <path
      d="M0 242c101-11 166 11 279 0s141-5 201-1"
      fill="none"
      stroke="#d8d0b9"
      stroke-width="2"
    />
    <path d="M155 209v-61h91v61" fill="#f5e6c9" />
    <path d="m137 154 63-54 65 54-19-5-46-30-45 30Z" fill="#9b674d" />
    <path d="m143 142 57-52 59 52-14-2-45-32-43 32Z" fill="#ce9f5f" />
    <path d="m155 126 45-46 47 46-47-26Z" fill="#b8874e" />
    <path d="M200 81V62" stroke="#8f6944" stroke-width="3" />
    <path d="M175 209v-44h16v44m17 0v-44h16v44" fill="#a78560" />
    <path d="M293 215v-29l9-7v-21l8-8v-28l8-21 8 21v28l8 8v21l9 7v29Z" fill="#c3914b" />
    <path d="M318 104V74m-16 85h32m-41 30h50" stroke="#936f42" stroke-width="2" />
    <path d="M129 215h225" stroke="#8a735c" stroke-width="7" />
    <path d="M388 218v-48m0 16-19-16m19 6 23-17" stroke="#69796b" stroke-width="6" />
    <circle cx="389" cy="153" r="23" fill="#7f927b" />
  </svg>
</template>
