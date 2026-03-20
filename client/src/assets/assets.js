import logo from './logo.svg'
import searchIcon from './searchIcon.svg'
import userIcon from './userIcon.svg'
import calenderIcon from './calenderIcon.svg'
import locationIcon from './locationIcon.svg'
import starIconFilled from './starIconFilled.svg'
import arrowIcon from './arrowIcon.svg'
import starIconOutlined from './starIconOutlined.svg'
import instagramIcon from './instagramIcon.svg'
import facebookIcon from './facebookIcon.svg'
import twitterIcon from './twitterIcon.svg'
import linkendinIcon from './linkendinIcon.svg'
import freeWifiIcon from './freeWifiIcon.svg'
import freeBreakfastIcon from './freeBreakfastIcon.svg'
import roomServiceIcon from './roomServiceIcon.svg'
import mountainIcon from './mountainIcon.svg'
import poolIcon from './poolIcon.svg'
import homeIcon from './homeIcon.svg'
import closeIcon from './closeIcon.svg'
import locationFilledIcon from './locationFilledIcon.svg'
import heartIcon from './heartIcon.svg'
import badgeIcon from './badgeIcon.svg'
import menuIcon from './menuIcon.svg'
import closeMenu from './closeMenu.svg'
import guestsIcon from './guestsIcon.svg'
import regImage from './regImage.png'
import exclusiveOfferCardImg1 from "./exclusiveOfferCardImg1.png";
import exclusiveOfferCardImg2 from "./exclusiveOfferCardImg2.png";
import exclusiveOfferCardImg3 from "./exclusiveOfferCardImg3.png";
import addIcon from "./addIcon.svg";
import dashboardIcon from "./dashboardIcon.svg";
import listIcon from "./listIcon.svg";
import uploadArea from "./uploadArea.svg";
import totalBookingIcon from "./totalBookingIcon.svg";
import totalRevenueIcon from "./totalRevenueIcon.svg";
import exp_spa from "./exp_spa.png";
import exp_dining from "./exp_dining.png";
import exp_nature from "./exp_nature.png";
import exp_culture from "./exp_culture.png";
import exp_urban_lobby from "./exp_urban_lobby.png";
import exp_county_retreat from "./exp_county_retreat.png";
import exp_spa_editorial from "./exp_spa_editorial.png";
import exp_dining_editorial from "./exp_dining_editorial.png";
import exp_nature_editorial from "./exp_nature_editorial.png";
import exp_culture_editorial from "./exp_culture_editorial.png";
import exp_rooftop_suite from "./exp_rooftop_suite.png";
import exp_hero_bedroom from "./exp_hero_bedroom.png";
import about_arch from "./about_arch.png";
import about_resort from "./about_resort.png";
import about_hero from "./about_hero.png";
import about_timeline_1 from "./about_timeline_1.png";
import about_timeline_2 from "./about_timeline_2.png";
import about_timeline_3 from "./about_timeline_3.png";
import about_section_break from "./about_section_break.png";


export const assets = {
    logo,
    searchIcon,
    userIcon,
    calenderIcon,
    locationIcon,
    starIconFilled,
    arrowIcon,
    starIconOutlined,
    instagramIcon,
    facebookIcon,
    twitterIcon,
    linkendinIcon,
    freeWifiIcon,
    freeBreakfastIcon,
    roomServiceIcon,
    mountainIcon,
    poolIcon,
    closeIcon,
    homeIcon,
    locationFilledIcon,
    heartIcon,
    badgeIcon,
    menuIcon,
    closeMenu,
    guestsIcon,
    regImage,
    addIcon,
    dashboardIcon,
    listIcon,
    uploadArea,
    totalBookingIcon,
    totalRevenueIcon,
    exp_spa,
    exp_dining,
    exp_nature,
    exp_culture,
    exp_urban_lobby,
    exp_county_retreat,
    exp_spa_editorial,
    exp_dining_editorial,
    exp_nature_editorial,
    exp_culture_editorial,
    exp_rooftop_suite,
    exp_hero_bedroom,
    about_arch,
    about_resort,
    about_hero,
    about_timeline_1,
    about_timeline_2,
    about_timeline_3,
    about_section_break,
}

export const cities = [
    "Hà Nội",
    "Đà Nẵng",
    "TP. Hồ Chí Minh",
    "Đà Lạt",
];

// Exclusive Offers Dummy Data
export const exclusiveOffers = [
    { _id: 1, title: "Gói nghỉ dưỡng mùa hè", description: "Tặng 1 đêm nghỉ và buffet sáng mỗi ngày", priceOff: 25, expiryDate: "31/08", image: exclusiveOfferCardImg1 },
    { _id: 2, title: "Kỳ nghỉ lãng mạn", description: "Ưu đãi cho cặp đôi kèm trải nghiệm spa thư giãn", priceOff: 20, expiryDate: "20/09", image: exclusiveOfferCardImg2 },
    { _id: 3, title: "Trải nghiệm nghỉ dưỡng cao cấp", description: "Đặt sớm 60 ngày để nhận ưu đãi cho kỳ nghỉ tại các khách sạn đối tác", priceOff: 30, expiryDate: "25/09", image: exclusiveOfferCardImg3 },
]

// Testimonials Dummy Data
export const testimonials = [
    { id: 1, name: "Nguyễn Minh Anh", address: "Hà Nội, Việt Nam", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200", rating: 5, review: "Mình đã dùng nhiều nền tảng đặt phòng, nhưng trải nghiệm ở đây rất mượt và thông tin khách sạn rõ ràng, chi tiết." },
    { id: 2, name: "Trần Quốc Huy", address: "TP. Hồ Chí Minh, Việt Nam", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", rating: 4, review: "Quy trình đặt phòng nhanh, dễ dùng. Khách sạn đúng mô tả và hỗ trợ rất nhiệt tình." },
    { id: 3, name: "Lê Thuỳ Dương", address: "Đà Nẵng, Việt Nam", image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?q=80&w=200", rating: 5, review: "Mình tìm được nhiều lựa chọn đẹp và giá hợp lý. Gợi ý theo địa điểm cũng rất chuẩn." }
];

// Facility Icon
export const facilityIcons = {
    "Free WiFi": assets.freeWifiIcon,
    "Free Breakfast": assets.freeBreakfastIcon,
    "Room Service": assets.roomServiceIcon,
    "Mountain View": assets.mountainIcon,
    "Pool Access": assets.poolIcon,
};

// For Room Details Page
export const roomCommonData = [
    { icon: assets.homeIcon, title: "Lưu trú sạch sẽ & an toàn", description: "Không gian được chăm sóc kỹ lưỡng, đảm bảo vệ sinh cho bạn." },
    { icon: assets.badgeIcon, title: "Vệ sinh tăng cường", description: "Cơ sở lưu trú tuân thủ quy trình làm sạch nghiêm ngặt." },
    { icon: assets.locationFilledIcon, title: "Vị trí thuận tiện", description: "90% khách lưu trú đánh giá vị trí ở mức 5 sao." },
    { icon: assets.heartIcon, title: "Nhận phòng nhanh chóng", description: "100% khách đánh giá quy trình check-in rất thuận tiện." },
];


