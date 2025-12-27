import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Linkedin, Github, Facebook, Instagram, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Developers.css';

const Developers = () => {
    const navigate = useNavigate();
    const [selectedDev, setSelectedDev] = React.useState(null);

    const developersV1 = [
        {
            name: "Gangadhar Rongala",
            role: "Full Stack Web Developer",
            id: "21471A0521",
            batch: "2021-2025",
            dept: "Computer Science Engineering",
            college: "Narasaraopeta Engineering College",
            image: "/images/developers/21471A0521.png",
            linkedin: "https://www.linkedin.com/in/gangadhar-rongala-b65bb122a/",
            github: "#",
            facebook: "#",
            instagram: "#"
        },
        {
            name: "Bhuvanesh Thotakura",
            role: "Full Stack Web Developer",
            id: "21471A05K4",
            batch: "2021-2025",
            dept: "Computer Science Engineering",
            college: "Narasaraopeta Engineering College",
            image: "/images/developers/21471A05K4.png",
            linkedin: "https://www.linkedin.com/in/bhuvanesh-thotakura-079b37283/",
            github: "#",
            facebook: "#",
            instagram: "#"
        }
    ];

    const developersV2 = [
        {
            name: "JADAM SURYA TEJA",
            role: "Full Stack Web Developer",
            id: "22471A05M6",
            batch: "2022-2026",
            dept: "Computer Science Engineering",
            college: "Narasaraopeta Engineering College",
            image: "/images/developers/SuryaTeja.jpeg",
            linkedin: "https://www.linkedin.com/in/jadamsurya",
            github: "https://github.com/jadamsuryateja",
            facebook: "", /* Removed as per request */
            instagram: "https://www.instagram.com/_s_u_r_y_a_.j_/"
        }
    ];

    const galleryImages = [
        "/images/developers/hostel-2.jpg",
        "/images/developers/hostel-1.jpg",
        "/images/developers/hostel-4.jpg",
        "/images/developers/hostel-3.jpg"
    ];


    // Carousel state
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    const goToImage = (index) => {
        setCurrentIndex(index);
    };

    // Auto-play carousel
    React.useEffect(() => {
        const timer = setInterval(() => {
            nextImage();
        }, 3000); // Change every 3 seconds

        return () => clearInterval(timer);
    }, []);

    const DeveloperCard = ({ dev, isHorizontal = false }) => (
        <div className={`developer-card ${isHorizontal ? 'horizontal-card' : ''}`} onClick={() => setSelectedDev(dev)}>
            <div className="dev-img-container">
                <img src={dev.image} alt={dev.name} className="dev-img" />
            </div>
            <div className="dev-content">
                <h3 className="dev-name">{dev.name}</h3>
                <p className="dev-role">{dev.role}</p>
                <div className="dev-desc">
                    <div>{dev.id} ({dev.batch})</div>
                    <div>{dev.dept}</div>
                    <div>{dev.college}</div>
                </div>
                <div className="dev-socials">
                    {dev.linkedin && (
                        <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                            <Linkedin size={20} />
                        </a>
                    )}
                    {dev.github && (
                        <a href={dev.github} target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub" onClick={(e) => e.stopPropagation()}>
                            <Github size={20} />
                        </a>
                    )}
                    {dev.facebook && (
                        <a href={dev.facebook} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook" onClick={(e) => e.stopPropagation()}>
                            <Facebook size={20} />
                        </a>
                    )}
                    {dev.instagram && (
                        <a href={dev.instagram} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram" onClick={(e) => e.stopPropagation()}>
                            <Instagram size={20} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="developers-container">
            <div className="developers-content">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="page-title">Meet the Developers</h1>
                </div>

                <h2 className="section-title">Version (V1.0) Developers</h2>
                <div className="developers-grid">
                    {developersV1.map((dev, index) => (
                        <DeveloperCard key={index} dev={dev} />
                    ))}
                </div>

                <h2 className="section-title">Version (V2.0) Developer</h2>
                <div className="developers-grid">
                    {developersV2.map((dev, index) => (
                        <DeveloperCard key={index} dev={dev} isHorizontal={true} />
                    ))}
                </div>

                <div className="gallery-section">
                    <div className="carousel-container-single">
                        <div className="carousel-wrapper">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentIndex}
                                    src={galleryImages[currentIndex]}
                                    alt={`Gallery ${currentIndex + 1}`}
                                    className="carousel-img-single"
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </AnimatePresence>

                            <button className="carousel-btn prev" onClick={prevImage}>
                                <ChevronLeft size={24} />
                            </button>
                            <button className="carousel-btn next" onClick={nextImage}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedDev && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedDev(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="modal-close" onClick={() => setSelectedDev(null)}>
                                <X size={24} />
                            </button>
                            <div className="modal-body">
                                <div className="modal-img-container">
                                    <img src={selectedDev.image} alt={selectedDev.name} className="modal-img" />
                                </div>
                                <h2 className="modal-name">{selectedDev.name}</h2>
                                <p className="modal-role">{selectedDev.role}</p>
                                <div className="modal-details">
                                    <p>{selectedDev.id}</p>
                                    <p>{selectedDev.batch}</p>
                                    <p>{selectedDev.dept}</p>
                                    <p>{selectedDev.college}</p>
                                </div>
                                <div className="dev-socials modal-socials">
                                    {selectedDev.linkedin && (
                                        <a href={selectedDev.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                                            <Linkedin size={24} />
                                        </a>
                                    )}
                                    <a href={selectedDev.github || "#"} target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                                        <Github size={24} />
                                    </a>
                                    <a href={selectedDev.facebook || "#"} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                                        <Facebook size={24} />
                                    </a>
                                    <a href={selectedDev.instagram || "#"} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                                        <Instagram size={24} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Developers;
