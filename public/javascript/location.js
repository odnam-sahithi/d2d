//  var x;
//         function getLocation() {
//             if (window.navigator.geolocation) {
//                 window.navigator.geolocation.getCurrentPosition(showPosition);
//             } else {
//                 x.innerHTML = "Geolocation is not supported by this browser.";
//             }
//         }

//         function showPosition(position) {
//             x = position.coords.latitude +
//                 ", " + position.coords.longitude;
//         }
//         console.log(x);
const successCallBack = (position) => {
    // console.log(posisiton.coords.latitude);
    const { latitude, longitude } = position.coords;
    console.log(latitude, longitude);
}
if (window.navigator) {
    window.navigator.geolocation.getCurrentPosition(
        successCallBack,
        // failureCallBack
    );
}
