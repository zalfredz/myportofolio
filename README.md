Nama : Alfredo Harsono

NPM : 2506656412

Kelas : PBP C

Semester : 3

### Assignment 1
1. Saya menggunakan elemen HTML5 seperti <header>, <nav>, <main>, <section>, <article>, <figure>, dan <footer>. Elemen <section> digunakan untuk membagi halaman menjadi Profile, Experience, dan Education. Section education juga menggunakan <article>, sedangkan foto-foto dan captionnya menggunakan <figure> & <figcaption>. Dengan struktur ini page web lebih rapi, mudah dibaca, dan memudahkan CSS menargetkan bagian pada static web.

2. Tantangan utamanya adalah menjaga layout agar tetap stabil dan pas saat ukuran layar mengecil. Di website desktop, section profile menggunakan grid untuk menampilkan teks dan foto secara berdampingan, sedangkan di mobile layoutnya diubah menjadi satu kolom agar teks tidak terpotong. Pada section education, ukuran logo dan kolom timeline diperkecil agar informasi tetap terbaca. Saya mengutamakan judul dan informasi utama dulu baru elemen visual seperti foto, logo, tombol, dan jaraknya yang disesuaikan melalui media query.

3. Batasan yang saya rasakan adalah semua data, seperti pengalaman, pendidikan, foto, dan deskripsi, masih ditulis langsung lewat HTML. Jika mau nambah informasi, saya harus edit code dan melakukan deploy ulang. Website ini juga belum memiliki form yang memungkinkan viewer menghubungi saya melalui webnya dan belum ada tempat untuk menaruh aplikasi atau proyek yang saya buat. Ke depannya, saya ingin menggunakan database dan django admin agar data informasi baru yang saya mau tambahkan bisa   ditambah atau diubah dengan lebih mudah tanpa mengedit HTML.

### AI Disclosure
Saya menggunakan bantuan eksternal dalam membuat tugas individu ini.

Pertama-tama saya menggunakan website https://www.codingnepalweb.com/create-responsive-card-slider-html-javascript/ untuk membantu mengerjakan section Education. Dari website ini, saya mempelajari dan menggunakan referensi mengenai struktur HTML, penggunaan CSS, serta JavaScript yang digunakan untuk membuat card slider yang responsif. Saya kemudian menyesuaikan kode tersebut dengan kebutuhan dan desain website yang saya buat. 

Selain itu, saya juga menggunakan bantuan AI (model KIMI) untuk melakukan debugging ketika terdapat error pada kode maupun hal yang tidak sesuai keinginan saya. Penggunaan AI tersebut berfungsi sebagai alat bantu dalam proses perbaikan code, sementara penyesuaian code, integrasi dengan bagian website lainnya saya kerjakan dan sesuaikan sendiri.
bisa di cek melalui link berikut: https://www.kimi.ai/share/1a076cef-ed22-8326-8000-0000c110a5c2.


### Implementasi SARAN KIMI (AI):
1. Section Profile
Saran solusi dari AI:
Gunakan min-height daripada tinggi tetap agar section tidak memotong konten. Atur konten utama dengan flexbox atau grid dan hindari absolute pada teks atau foto utama.

Implementasi saya:
Saya menggunakan min-height: 100vh dan min-height: 100dvh pada section. Teks dan foto diatur memakai flexbox serta grid, sehingga konten tetap berada dalam alur layout.

2. Experience section
Saran solusi dari AI:
Jangan memaksa experience selalu muat dalam satu layar karena isi section dapat lebih panjang. Lebih baik biarkan section mengikuti tinggi konten dan dapat di scroll.

Implementasi saya:
Saya tidak menggunakan height: 100vh pada experience. Section memakai padding biasa dan carousel mengikuti tinggi gambar serta deskripsinya, sehingga tidak memotong judul atau teks.

3. Logo di section Education
Saran solusi dari AI:
Periksa apakah garis pada logo berasal dari border, outline, atau box-shadow CSS. Jika garis masih ada setelah CSS dibersihkan, kemungkinan berasal dari file PNG.

Implementasi saya:
Saya menghapus border putus-putus pada container logo Education dan menambahkan reset border: none, outline: none, serta box-shadow: none pada container dan gambar logo.