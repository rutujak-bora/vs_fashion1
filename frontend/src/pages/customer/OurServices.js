import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Scissors, 
  Sparkles, 
  Layers, 
  HeartHandshake, 
  CheckCircle2, 
  MessageCircle, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Send,
  Star,
  MapPin,
  Mail
} from 'lucide-react';

export default function OurServices() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Customize Order & Tailoring Services | VS Fashion";
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: 'Customize Cloth Order',
    eventDate: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please provide your name and contact number.');
      return;
    }

    const text = `*New Service Inquiry - VS Fashion Website*%0A%0A` +
      `*Name:* ${encodeURIComponent(formData.name)}%0A` +
      `*Phone:* ${encodeURIComponent(formData.phone)}%0A` +
      `*Service Required:* ${encodeURIComponent(formData.service)}%0A` +
      (formData.eventDate ? `*Event / Target Date:* ${encodeURIComponent(formData.eventDate)}%0A` : '') +
      (formData.message ? `*Requirements:* ${encodeURIComponent(formData.message)}%0A` : '');

    window.open(`https://wa.me/918421968737?text=${text}`, '_blank');
  };

  const openWhatsAppDirect = (serviceTitle) => {
    const text = `Hello VS Fashion! I am visiting your website and would like to inquire about *${serviceTitle}*. Please share more details and availability.`;
    window.open(`https://wa.me/918421968737?text=${encodeURIComponent(text)}`, '_blank');
  };

  const services = [
    {
      id: 'customize-order',
      title: 'Customize Cloth Order',
      subtitle: 'Bespoke Tailoring & Made-to-Measure Silhouettes',
      badge: 'Bespoke Craftsmanship',
      icon: Scissors,
      tagline: 'Your dream design, tailored precisely to your silhouette.',
      description: 
        'Have a specific design, custom neckline, unique sleeve cut, or traditional print in mind? Our skilled master tailors work with you one-on-one to create bespoke kurtis, flared anarkalis, festive co-ord sets, and modern fusion wear cut specifically to your measurements.',
      highlights: [
        'Personalized fabric, print & color selection (Pure Cotton, Chanderi, Mulmul & Silk)',
        'Precise body measurements with custom necklines, sleeves & lining options',
        'Inclusive sizing from XS to 6XL with flattering silhouettes',
        'Fine hand-finishing, durable stitching & comfort-first inner linings'
      ],
      ctaText: 'Inquire for Custom Stitching'
    },
    {
      id: 'navratri-rent',
      title: 'Navratri Cloth on Rent',
      subtitle: 'Designer Chaniya Cholis & Traditional Garba Outfits',
      badge: 'Festive Favorite',
      icon: Sparkles,
      tagline: 'Twirl through the 9 nights of Garba in breathtaking designer fashion.',
      description: 
        'Celebrate Navratri with grandeur without the high expense of buying outfits you only wear once! Browse our exclusive, heavily flared designer Chaniya Cholis featuring traditional mirror work, Kutchi embroidery, Gamthi borders, and vibrant festive dupattas.',
      highlights: [
        'Huge flairs (10+ meters), vibrant traditional colors & authentic mirror-work',
        '100% professionally sanitized, dry-cleaned & steam-ironed before handover',
        'Cost-effective single-night & 9-day season rental packages',
        'Hassle-free security deposit, easy pickup in Pune & reserved advance bookings'
      ],
      ctaText: 'Check Navratri Rental Availability'
    },
    {
      id: 'bulk-customize',
      title: 'Bulk Customize Order',
      subtitle: 'Uniforms, Dance Troupes, Boutiques & Event Gifting',
      badge: 'Volume Pricing',
      icon: Layers,
      tagline: 'Consistent premium quality, scaled for grand groups & corporate occasions.',
      description: 
        'Planning coordinated attire for a corporate festive day, bridesmaid squad, dance troupe performance, college festival, or boutique retail collection? VS Fashion undertakes large-volume custom production with unwavering attention to fabric quality and on-time delivery.',
      highlights: [
        'Tiered wholesale pricing with low Minimum Order Quantities (MOQ)',
        'Custom color palettes, matching family sets & themed uniforms',
        'Sample approval and mock-up review prior to full batch production',
        'Standardized sizing chart, professional packaging & reliable Pan-India shipping'
      ],
      ctaText: 'Request Bulk Order Quotation'
    },
    {
      id: 'wedding-stitch',
      title: 'Wedding Cloth Stitch Order Accepted',
      subtitle: 'Bridal Trousseau, Haldi, Mehendi & Sangeet Couture',
      badge: 'Master Couturiers',
      icon: HeartHandshake,
      tagline: 'Exquisite bridal stitching to make your most sacred milestones unforgettable.',
      description: 
        'From radiant Haldi yellow shararas and Mehendi lehengas to glamorous Sangeet outfits and bridal reception couture. We accept complete wedding stitching orders for brides, bridesmaids, and family members, ensuring royal finishing, padded comfort blouses, and custom handcrafted latkans.',
      highlights: [
        'Complete bridal wear stitching: Lehengas, Designer Blouses, Pre-pleated Sarees & Gowns',
        'Intricate hand-done Latkans, Zari borders, Gotta Patti & delicate sequin detailing',
        'Dedicated trial fittings to guarantee 100% silhouette perfection',
        'Express stitch-and-deliver options available for upcoming wedding schedules'
      ],
      ctaText: 'Book Wedding Consultation'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800">
      {/* Background Motif Accent */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-repeat"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")',
        }}
      />

      <div className="relative z-10">
        {/* Hero Header Section */}
        <section className="relative bg-gradient-to-b from-[#8B1B4A]/10 via-[#8B1B4A]/5 to-transparent pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#8B1B4A]/10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-[#8B1B4A]/10 text-[#8B1B4A] mb-4">
              <Sparkles size={14} /> Bespoke Fashion & Rental Services
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#8B1B4A] tracking-tight mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>
              Our Specialty Services
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              At <strong className="text-[#8B1B4A]">VS Fashion</strong>, we celebrate your individuality. Explore our tailor-made services—from custom made-to-measure tailoring and festive Navratri rentals to bulk corporate orders and royal wedding couture stitching.
            </p>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-2.5 mt-8">
              {services.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-full bg-white text-gray-700 hover:text-[#8B1B4A] hover:border-[#8B1B4A] border border-gray-200 shadow-sm transition-all hover:scale-105"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Services Showcase Cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-16">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              const isEven = index % 2 === 1;

              return (
                <div
                  key={service.id}
                  id={service.id}
                  className="scroll-mt-28 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className={`p-6 sm:p-10 lg:p-12 flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-center`}>
                    
                    {/* Visual Card / Left Column */}
                    <div className="w-full lg:w-5/12 bg-gradient-to-br from-[#8B1B4A]/5 to-[#8B1B4A]/15 rounded-xl p-8 border border-[#8B1B4A]/10 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="w-14 h-14 rounded-2xl bg-[#8B1B4A] text-white flex items-center justify-center mb-6 shadow-md shadow-[#8B1B4A]/20">
                          <IconComponent size={28} />
                        </div>
                        <span className="text-xs uppercase font-bold tracking-widest text-[#8B1B4A] bg-[#8B1B4A]/10 px-3 py-1 rounded-full">
                          {service.badge}
                        </span>
                        <h3 className="text-2xl font-serif text-gray-900 mt-4 font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {service.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                          {service.subtitle}
                        </p>
                        <blockquote className="italic text-sm text-[#8B1B4A] mt-4 border-l-2 border-[#8B1B4A] pl-3 py-0.5">
                          "{service.tagline}"
                        </blockquote>
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#8B1B4A]/15">
                        <button
                          onClick={() => openWhatsAppDirect(service.title)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wider uppercase transition-transform hover:scale-[1.02] shadow-sm"
                        >
                          <MessageCircle size={18} />
                          {service.ctaText}
                        </button>
                      </div>
                    </div>

                    {/* Details Column / Right Column */}
                    <div className="w-full lg:w-7/12 space-y-6">
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                        {service.description}
                      </p>

                      <div>
                        <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3.5">
                          Service Highlights & Inclusions
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {service.highlights.map((highlight, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                              <CheckCircle2 size={16} className="text-[#8B1B4A] mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">
                                {highlight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Micro info note */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-amber-50/60 border border-amber-200/60 p-3 rounded-lg">
                        <Clock size={15} className="text-amber-700 flex-shrink-0" />
                        <span>
                          Consultations are free. Direct doorstep delivery or in-store Pune pickup available.
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4-Step Process Section */}
        <section className="bg-white py-16 border-y border-gray-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-widest font-bold text-[#8B1B4A]">
                Smooth & Seamless
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif text-gray-900 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                How Our Service Works
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Four simple steps to bring your tailored outfit or festive rental directly to you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Connect & Consult',
                  desc: 'Reach out via WhatsApp or call with your design reference, event date, or rental requirements.'
                },
                {
                  step: '02',
                  title: 'Measurements & Fabric',
                  desc: 'Provide your measurements or visit our studio in Kothrud, Pune for personalized fabric selection.'
                },
                {
                  step: '03',
                  title: 'Handcrafted Stitching',
                  desc: 'Our master craftsmen cut, sew, line, and embellish your pieces with meticulous care.'
                },
                {
                  step: '04',
                  title: 'Trial & Delivery',
                  desc: 'Receive your outfit ready to wear, with trial assistance and minor adjustments guaranteed.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-xl bg-gray-50 border border-gray-100 relative group hover:border-[#8B1B4A]/30 transition-colors">
                  <div className="text-3xl font-serif font-bold text-[#8B1B4A]/25 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {item.step}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Inquiry Form & Contact Info */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden grid lg:grid-cols-12">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-7 p-6 sm:p-10">
              <span className="text-xs uppercase font-bold tracking-widest text-[#8B1B4A]">
                Instant Request
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-gray-900 mt-1 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Book an Appointment or Inquire
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-6">
                Fill out the quick form below, and we will immediately connect with you on WhatsApp with designs, fabric catalogs, and quotes.
              </p>

              <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Anjali Sharma"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#8B1B4A] focus:ring-1 focus:ring-[#8B1B4A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      WhatsApp / Mobile No *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#8B1B4A] focus:ring-1 focus:ring-[#8B1B4A]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Service Required *
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#8B1B4A] focus:ring-1 focus:ring-[#8B1B4A] bg-white"
                    >
                      <option value="Customize Cloth Order">Customize Cloth Order</option>
                      <option value="Navratri Cloth on Rent">Navratri Cloth on Rent</option>
                      <option value="Bulk Customize Order">Bulk Customize Order</option>
                      <option value="Wedding Cloth Stitch Order">Wedding Cloth Stitch Order</option>
                      <option value="Other Bespoke Requirement">Other / General Consultation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Target Event / Delivery Date
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#8B1B4A] focus:ring-1 focus:ring-[#8B1B4A] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                    Order Details / Design Notes
                  </label>
                  <textarea
                    rows={3}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about the fabric preference, quantity, sizing, or styling notes..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#8B1B4A] focus:ring-1 focus:ring-[#8B1B4A]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#8B1B4A] hover:bg-[#A4305E] text-white py-3 px-6 rounded-xl text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors shadow-sm"
                >
                  <Send size={16} /> Send Inquiry via WhatsApp
                </button>
              </form>
            </div>

            {/* Right Column: Studio Visit & Direct Contact */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#8B1B4A] to-[#671236] text-white p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-pink-200 font-semibold">
                  Personal Consultation
                </span>
                <h3 className="text-2xl font-serif mt-1 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Visit Our Studio
                </h3>
                <p className="text-xs sm:text-sm text-pink-100/90 leading-relaxed mb-8">
                  Prefer in-person fitting and fabric touch-and-feel? We warmly welcome you to our studio in Pune for measurements and design discussions.
                </p>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-pink-300 flex-shrink-0 mt-0.5" />
                    <span className="text-pink-100">
                      Gulab Shrushti by Rajendra Buttepatil,<br />
                      3rd Floor, Flat 301, Kothrud,<br />
                      Pune, Maharashtra 411038
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-pink-300 flex-shrink-0" />
                    <a href="tel:+918421968737" className="text-pink-100 hover:text-white underline-offset-2 hover:underline">
                      +91 84219 68737
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-pink-300 flex-shrink-0" />
                    <a href="mailto:vsfashiiiion@gmail.com" className="text-pink-100 hover:text-white underline-offset-2 hover:underline">
                      vsfashiiiion@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-[11px] text-pink-200">
                  Studio visits by appointment. Timings: 10:30 AM to 8:00 PM (Monday to Saturday).
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
