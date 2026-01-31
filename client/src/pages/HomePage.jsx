import { Link } from 'react-router-dom';
import { FaArrowRight, FaUsers, FaChartBar, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import cricketLogo from '../assets/images/cricketlogo.png';
import Button from '../components/Button';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-dark via-primary to-background-dark text-white">
      {/* Navbar */}
      <nav className="py-4 px-6 md:px-8 flex justify-between items-center backdrop-blur-sm bg-black/10 sticky top-0 z-10">
        <div className="flex items-center">
          <img src={cricketLogo} alt="SecondInning Logo" className="h-10 w-auto mr-2" />
          <span className="text-xl font-bold tracking-tight">SecondInning</span>
        </div>
        <div className="flex items-center">
          <Link to="/login" className="text-sm hover:text-secondary-light transition-colors mr-6">Login</Link>
          <Button to="/register" variant="secondary" size="sm">Sign Up</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-bounce-light">
            <img src={cricketLogo} alt="SecondInning Logo" className="w-24 h-auto md:w-28" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 slide-up">SecondInning</h1>
          <p className="text-lg md:text-xl text-blue-200 mb-8 slide-up">Discovering Tomorrow's Cricket Stars Today</p>
          
          <div className="max-w-2xl mx-auto text-base md:text-lg mb-12 slide-up opacity-90">
            <p className="mb-6">
              Are you a school cricketer with big dreams? SecondInning is here to 
              discover and nurture hidden cricket talents from schools across the 
              nation. Our platform helps young cricketers like you showcase their 
              skills and reach their full potential.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 slide-up">
            <Button 
              to="/register" 
              variant="secondary"
              size="lg"
              rightIcon={<FaArrowRight />}
              className="transform transition-transform duration-300 hover:-translate-y-1 shadow-rose"
            >
              Start Your Journey
            </Button>
            <Button 
              to="/about" 
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 transform transition-transform duration-300 hover:-translate-y-1"
            >
              Learn More
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white text-gray-800 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-primary">Why Choose SecondInning?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card p-6 flex flex-col items-center text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FaUsers className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Connect with Scouts</h3>
              <p className="text-gray-600 text-sm">Get discovered by professional cricket scouts looking for new talent.</p>
            </div>
            
            <div className="card p-6 flex flex-col items-center text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <FaChartBar className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Track Your Progress</h3>
              <p className="text-gray-600 text-sm">Detailed statistics to help you monitor and improve your performance.</p>
            </div>
            
            <div className="card p-6 flex flex-col items-center text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <FaShieldAlt className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Professional Coaching</h3>
              <p className="text-gray-600 text-sm">Access to expert coaching tips and personalized advice.</p>
            </div>
            
            <div className="card p-6 flex flex-col items-center text-center card-hover">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <FaTrophy className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Showcase Achievements</h3>
              <p className="text-gray-600 text-sm">Highlight your cricket achievements and build your sports profile.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Take Your Cricket Career to the Next Level?</h2>
          <p className="text-lg mb-8 text-white/80">Join hundreds of school cricketers who have found opportunities through SecondInning.</p>
          <Button 
            to="/register" 
            variant="ghost"
            size="xl"
            rightIcon={<FaArrowRight />}
            className="bg-white text-primary hover:bg-blue-50 shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-dark py-8 text-center text-sm text-blue-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-4">
            <div className="flex justify-center mb-4">
              <img src={cricketLogo} alt="SecondInning Logo" className="h-8 w-auto mr-2" />
              <span className="text-lg font-bold">SecondInning</span>
            </div>
            <p className="text-xs text-blue-300/60 mb-6">Empowering the next generation of cricket stars</p>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            <Button variant="link" to="/about" className="text-blue-200 hover:text-white">About</Button>
            <Button variant="link" to="/contact" className="text-blue-200 hover:text-white">Contact</Button>
            <Button variant="link" to="/privacy" className="text-blue-200 hover:text-white">Privacy</Button>
            <Button variant="link" to="/terms" className="text-blue-200 hover:text-white">Terms</Button>
          </div>
          <p className="text-xs text-blue-300/60">© 2025 SecondInning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 