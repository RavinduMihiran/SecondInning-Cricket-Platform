import { Link } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaChartBar, FaShieldAlt, FaTrophy, FaGraduationCap, FaHandshake, FaChartLine } from 'react-icons/fa';
import { GiCricketBat } from 'react-icons/gi';
import { MdStars, MdSportsCricket } from 'react-icons/md';
import cricketLogo from '../assets/images/cricketlogo.png';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-dark via-primary to-background-dark text-white">
      {/* Navbar */}
      <nav className="py-4 px-6 md:px-8 flex justify-between items-center backdrop-blur-sm bg-black/10 sticky top-0 z-10">
        <div className="flex items-center">
          <img src={cricketLogo} alt="SecondInning Logo" className="h-10 w-auto mr-2" />
          <span className="text-xl font-bold tracking-tight">SecondInning</span>
        </div>
        <div className="flex items-center">
          <Link to="/" className="text-sm hover:text-secondary-light transition-colors flex items-center mr-6">
            <FaArrowLeft className="mr-2" /> Back to Home
          </Link>
          <Link to="/login" className="text-sm hover:text-secondary-light transition-colors mr-6">Login</Link>
          <Link to="/register" className="btn bg-secondary hover:bg-secondary-dark text-white text-sm py-2 px-4 rounded-md shadow-md mr-2">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section with Animation */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/50 to-transparent z-0"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
        
        <main className="relative z-1 flex-1 flex flex-col items-center px-6 py-12 fade-in">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center animate-fadeIn">
              About <span className="text-secondary">Second</span><span className="text-accent">Inning</span>
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-secondary to-accent mx-auto mb-12 animate-pulse"></div>
            
            {/* Mission Section with Enhanced Styling */}
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-xl mb-12 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 transform hover:scale-[1.01]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mr-4">
                  <MdStars className="text-secondary text-2xl" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-secondary">Our Mission</h2>
              </div>
              <p className="text-lg mb-6 text-blue-100 leading-relaxed">
                SecondInning is dedicated to discovering and nurturing cricket talent from schools across Sri Lanka. 
                We believe that every young cricketer deserves a platform to showcase their skills and reach their full potential.
              </p>
              <p className="text-lg mb-6 text-blue-100 leading-relaxed">
                Our mission is to bridge the gap between school cricket and professional opportunities, 
                providing young players with the exposure, guidance, and resources they need to succeed in the sport they love.
              </p>
            </div>
            
            {/* Vision & Values with Enhanced Styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-gradient-to-br from-primary/40 to-primary-dark/60 backdrop-blur-sm p-8 rounded-xl shadow-xl transform transition-all duration-300 hover:translate-y-[-5px] border border-accent/20 hover:border-accent/40">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                    <FaChartLine className="text-accent text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-accent">Our Vision</h2>
                </div>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  To create a thriving ecosystem where cricket talent is identified early, 
                  nurtured professionally, and given clear pathways to national and international success.
                </p>
                <p className="text-blue-100 leading-relaxed">
                  We envision a future where no talented young cricketer is overlooked due to lack of exposure or resources.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-primary/40 to-primary-dark/60 backdrop-blur-sm p-8 rounded-xl shadow-xl transform transition-all duration-300 hover:translate-y-[-5px] border border-secondary/20 hover:border-secondary/40">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
                    <FaShieldAlt className="text-secondary text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary">Our Values</h2>
                </div>
                <ul className="text-blue-100 space-y-4">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span>Integrity and transparency in all our operations</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span>Inclusivity and equal opportunities for all players</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span>Excellence in coaching and player development</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                    <span>Innovation in cricket talent identification</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* How SecondInning Works - New Enhanced Version */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-90 z-0"></div>
        <div className="absolute -top-40 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-1 max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 text-white">How SecondInning Works</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-secondary to-accent mx-auto mb-12"></div>
          <p className="text-center text-blue-100 mb-16 max-w-3xl mx-auto">
            Our platform connects young cricket talents with coaches, scouts, and opportunities through a comprehensive digital ecosystem.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-secondary/20 transform transition-all duration-300 hover:scale-105 hover:border-secondary flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-secondary/30 transition-all duration-300">
                <GiCricketBat className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-secondary">Create Your Profile</h3>
              <p className="text-blue-100">
                Sign up and build your cricket profile with your stats, achievements, and videos of your performance.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-accent/20 transform transition-all duration-300 hover:scale-105 hover:border-accent flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-accent to-secondary flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-accent/30 transition-all duration-300">
                <FaChartLine className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-accent">Track Your Progress</h3>
              <p className="text-blue-100">
                Update your stats after each match and track your improvement over time with detailed analytics.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-secondary/20 transform transition-all duration-300 hover:scale-105 hover:border-secondary flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-secondary to-accent flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-secondary/30 transition-all duration-300">
                <FaHandshake className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-secondary">Connect with Opportunities</h3>
              <p className="text-blue-100">
                Get discovered by scouts and coaches looking for talent, and receive personalized feedback on your game.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Join Us CTA with Enhanced Styling */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-accent opacity-90 z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary-dark to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-1 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 text-white">Join the SecondInning Community</h2>
          <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
          <p className="text-lg mb-10 text-white/90 max-w-3xl mx-auto">
            Whether you're a player looking to showcase your talent, a coach seeking promising cricketers, 
            or a parent supporting your child's cricket journey, SecondInning has something for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link 
              to="/register" 
              className="btn bg-white text-secondary hover:bg-blue-50 px-8 py-4 rounded-md inline-flex items-center justify-center gap-2 shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl font-bold"
            >
              Create Your Account
            </Link>
            <Link 
              to="/" 
              className="btn border-2 border-white text-white px-8 py-4 rounded-md text-base hover:bg-white/10 flex items-center justify-center transform transition-all duration-300 hover:-translate-y-1 font-bold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with Enhanced Styling */}
      <footer className="bg-background-dark py-10 text-center text-sm text-blue-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <img src={cricketLogo} alt="SecondInning Logo" className="h-10 w-auto mr-2" />
              <span className="text-xl font-bold">SecondInning</span>
            </div>
            <p className="text-sm text-blue-300/60 mb-6">Empowering the next generation of cricket stars</p>
          </div>
          <div className="flex justify-center space-x-8 mb-8">
            <Link to="/about" className="text-blue-200 hover:text-secondary transition-colors">About</Link>
            <a href="#" className="text-blue-200 hover:text-secondary transition-colors">Contact</a>
            <a href="#" className="text-blue-200 hover:text-secondary transition-colors">Privacy</a>
            <a href="#" className="text-blue-200 hover:text-secondary transition-colors">Terms</a>
          </div>
          <p className="text-xs text-blue-300/60">© 2025 SecondInning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage; 