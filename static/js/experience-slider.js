// Experience image slider.
const experienceSlider = new Swiper('.experience-swiper', {
    loop: true,
    grabCursor: true,
    slidesPerView: 1,
    spaceBetween: 0,
    roundLengths: true,
    pagination: {
        el: '.experience-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.experience-button-next',
        prevEl: '.experience-button-prev',
    },
});
