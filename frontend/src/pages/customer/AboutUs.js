import React from 'react';
import { Phone, Mail, MapPin, Heart } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen relative">
      {/* Traditional soft background */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-repeat"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")', // A traditional repeating pattern
        }}
      />
      <div className="relative z-10 bg-white/90">

        {/* Hero Section */}
        <section className="relative h-[300px] md:h-[400px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/about/main.jpeg")'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
          <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">
            </p>
          </div>
        </section>

        {/* About Content */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl text-[#8B1B4A] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                We are VS
              </h2>
              <div className="text-gray-600 leading-relaxed text-lg max-w-3xl mx-auto space-y-4">
                <p>
                  I'm Vaibhavi, and VS is a dream that started at home when I was 21. I named the brand from my mother, Santoshi, because she has always been my biggest inspiration. Each piece we design is essentially an homage to her timeless elegance and strength.
                </p>
                <p>
                  With constant support from my friends and family, and by showcasing my work through exhibitions, VS completed one year. Today, at 22, I feel grateful, confident, and proud of how far this beautiful journey has come ✨
                </p>
                <p>
                  We believe that clothing shouldn't just look beautiful—it should feel like home. Our mission is to blend deeply rooted traditions with modern sensibilities, making genuine handcrafted fashion accessible to everyone.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl text-[#8B1B4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Handcrafted With Love
                </h3>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  <p>
                    Our fabric is 100% hand block printed, created completely by hand. First, the blocks are carefully printed on the fabric using different colors. After printing, the fabric is soaked and washed in fresh water, and once it dries, it becomes ready for use.
                  </p>
                  <p>
                    Behind every single block, there is a lot of hard work and dedication—which you can see in the photos. We cherish these beautiful imperfections because they tell a story of human touch, patience, and authentic artistry that machines can never replicate.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <img src="/images/about/artisan work.jpeg" alt="Artisan at work" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <img src="/images/about/inside our traditional workshop.jpeg" alt="Artisan at work" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-xl border-4 border-white">
                  <img src="/images/about/Traditional Fabrics.jpeg" alt="Traditional fabrics" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="bg-pink-50/70 rounded-3xl p-8 md:p-16 mb-24 shadow-sm border border-pink-100/50 backdrop-blur-sm">
              <div className="text-center mb-16">
                <h3 className="text-3xl md:text-4xl text-[#8B1B4A] mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  How Our Products Are Made
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Take a look inside our workshop. From the intricate wooden blocks to the traditional dyeing vats, every step is done by hand with utmost care and passion.
                </p>
              </div>

              {/* Collage of Workshop Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white transform transition duration-500 hover:-translate-y-2">
                  <img src="/images/about/master artisan block printing.jpeg" alt="At the workshop" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white transform transition duration-500 hover:-translate-y-2 lg:translate-y-8">
                  <img src="/images/about/at the workshop.jpeg" alt="Master artisan block printing" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white transform transition duration-500 hover:-translate-y-2">
                  <img src="/images/about/process details.jpeg" alt="Traditional wooden block" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white transform transition duration-500 hover:-translate-y-2 lg:translate-y-8">
                  <img src="/images/about/traditional wooden block.jpeg" alt="Process details" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8 mt-12">
                <div className="bg-white/80 rounded-2xl p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#8B1B4A] text-white flex items-center justify-center font-bold text-lg mb-4">1</div>
                  <h4 className="font-bold text-gray-800 mb-2 text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>The Blocks</h4>
                  <p className="text-gray-600">Intricately carved wooden blocks are the soul of our prints. Each leaf and motif is brought to life by master carvers.</p>
                </div>
                <div className="bg-white/80 rounded-2xl p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#8B1B4A] text-white flex items-center justify-center font-bold text-lg mb-4">2</div>
                  <h4 className="font-bold text-gray-800 mb-2 text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>The Printing</h4>
                  <p className="text-gray-600">The blocks are carefully stamped onto the fabric by hand, aligning patterns perfectly using natural and deep colors.</p>
                </div>
                <div className="bg-white/80 rounded-2xl p-6 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#8B1B4A] text-white flex items-center justify-center font-bold text-lg mb-4">3</div>
                  <h4 className="font-bold text-gray-800 mb-2 text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>The Wash</h4>
                  <p className="text-gray-600">After printing, the fabric is soaked in fresh water vats and washed out, ensuring color fastness before it dries in the sun.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="w-12 h-12 bg-[#8B1B4A] rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Thoughtful Manufacturing
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our kurtis are manufactured right here in Pune. We understand that bodies evolve, so each kurti has proper 2-inch margins on both sides for easy, stress-free alterations. You deserve to wear clothes that adapt to you, not the other way around.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="w-12 h-12 bg-[#8B1B4A] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  The VS Promise
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  The fabric we use is non-shrinking because it is meticulously pre-washed before stitching. This is how we create beautiful kurtis that are comfortable, breathable, and made with natural dyes, specially designed for everyday ease, confidence, and long-lasting wear.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl text-center text-[#8B1B4A] mb-12" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Get in Touch
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-[#8B1B4A]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Call / WhatsApp</h4>
                <a href="tel:+918421968737" className="text-[#8B1B4A] hover:underline">
                  +91 84219 68737 / +91 89997 59293
                </a>
              </div>

              <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#8B1B4A]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Email Us</h4>
                <a href="mailto:vsfashiiiion@gmail.com" className="text-[#8B1B4A] hover:underline text-sm">
                  vsfashiiiion@gmail.com
                </a>
              </div>

              <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-[#8B1B4A]" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Owner</h4>
                <p className="text-gray-600 text-sm">Vaibhavi Choudhary</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
