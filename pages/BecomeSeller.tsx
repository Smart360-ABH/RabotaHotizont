
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Wallet, ShieldCheck, ArrowRight, CheckCircle, Smartphone, FileText } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { LogisticsModel } from '../types';

type RegistrationStep = 'landing' | 'phone' | 'business' | 'logistics' | 'success';

export const BecomeSeller: React.FC = () => {
  const { registerVendor } = useMarket();
  const navigate = useNavigate();
  const [step, setStep] = useState<RegistrationStep>('landing');
  const [loading, setLoading] = useState(false);

  // Form Data
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [businessData, setBusinessData] = useState({
      country: 'Abkhazia',
      taxType: 'IP' as 'IP' | 'OOO' | 'SelfEmployed',
      inn: '',
      companyName: ''
  });
  const [logisticsModel, setLogisticsModel] = useState<LogisticsModel>('FBS');

  const handleSendSms = () => {
      if(phone.length < 10) return alert("Введите корректный номер");
      setLoading(true);
      setTimeout(() => { setLoading(false); alert(`Код подтверждения: 1234`); }, 1000);
  };

  const handleVerifySms = () => {
      if(smsCode === '1234') setStep('business');
      else alert("Неверный код");
  };

  const handleRegister = () => {
      setLoading(true);
      
      const newVendorData = {
          name: businessData.companyName, // For internal profile
          companyName: businessData.companyName,
          inn: businessData.inn,
          taxType: businessData.taxType,
          address: businessData.country,
          logisticsModel: logisticsModel,
          balance: 0,
          rating: 0,
          status: 'pending' as const
      };

      setTimeout(() => {
          registerVendor(newVendorData);
          setLoading(false);
          setStep('success');
      }, 1500);
  };

  const finishRegistration = () => {
      navigate('/vendor');
  };

  // --- RENDER STEPS ---

  if (step === 'landing') {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        {/* Hero */}
        <div className="relative bg-indigo-900 py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Начните продавать на Горизонте</h1>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
                  Откройте доступ к тысячам покупателей. Мы берем на себя технологии и маркетинг, вы — создаете лучшие продукты.
              </p>
              <button 
                onClick={() => setStep('phone')} 
                className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-full hover:bg-indigo-50 transition shadow-lg hover:scale-105"
              >
                  Стать партнером
              </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="container mx-auto px-4 py-20">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-16">Почему выбирают нас?</h2>
            <div className="grid md:grid-cols-4 gap-8">
                {[
                    { icon: <Users className="w-8 h-8"/>, title: "Готовая аудитория", desc: "Тысячи активных пользователей ищут ваши товары ежедневно." },
                    { icon: <Wallet className="w-8 h-8"/>, title: "Быстрые выплаты", desc: "Перечисляем выручку еженедельно на ваш банковский счет." },
                    { icon: <TrendingUp className="w-8 h-8"/>, title: "Инструменты роста", desc: "Аналитика продаж, AI-помощник и маркетинговая поддержка." },
                    { icon: <ShieldCheck className="w-8 h-8"/>, title: "Безопасность", desc: "Защита сделок и прозрачная система рейтингов." }
                ].map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border dark:border-slate-700 text-center hover:-translate-y-2 transition duration-300">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3 dark:text-white">{item.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  // --- REGISTRATION FLOW ---
  return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-12 px-4">
          <div className={`w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden ${step === 'logistics' ? 'max-w-5xl' : 'max-w-xl'}`}>
              {/* Progress Bar */}
              <div className="bg-gray-100 dark:bg-slate-700 h-2 w-full">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500" 
                    style={{ width: step === 'phone' ? '25%' : step === 'business' ? '50%' : step === 'logistics' ? '75%' : '100%' }}
                  ></div>
              </div>

              <div className="p-8">
                  
                  {/* STEP 1: PHONE */}
                  {step === 'phone' && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="text-center">
                              <Smartphone className="w-12 h-12 text-indigo-600 mx-auto mb-4"/>
                              <h2 className="text-2xl font-bold dark:text-white">Регистрация партнера</h2>
                              <p className="text-gray-500">Введите номер телефона для создания кабинета</p>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Номер телефона</label>
                              <div className="flex gap-2">
                                  <input 
                                    type="tel" 
                                    placeholder="+7 940 000-00-00"
                                    className="flex-1 p-3 border dark:border-slate-600 dark:bg-slate-700 rounded-lg dark:text-white"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                  />
                                  <button onClick={handleSendSms} disabled={loading} className="px-4 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200">
                                      {loading ? '...' : 'Код'}
                                  </button>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Код из СМС</label>
                              <input 
                                type="text" 
                                placeholder="0000"
                                className="w-full p-3 border dark:border-slate-600 dark:bg-slate-700 rounded-lg dark:text-white text-center tracking-widest text-xl"
                                value={smsCode}
                                onChange={e => setSmsCode(e.target.value)}
                              />
                          </div>
                          <button onClick={handleVerifySms} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
                              Продолжить
                          </button>
                      </div>
                  )}

                  {/* STEP 2: BUSINESS INFO */}
                  {step === 'business' && (
                      <div className="space-y-6 animate-fade-in">
                          <div className="text-center">
                              <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-4"/>
                              <h2 className="text-2xl font-bold dark:text-white">Данные организации</h2>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Страна</label>
                                  <select className="w-full p-3 border dark:border-slate-600 dark:bg-slate-700 rounded-lg dark:text-white">
                                      <option>Абхазия</option>
                                      <option>Россия</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Форма</label>
                                  <select 
                                    className="w-full p-3 border dark:border-slate-600 dark:bg-slate-700 rounded-lg dark:text-white"
                                    value={businessData.taxType}
                                    onChange={e => setBusinessData({...businessData, taxType: e.target.value as any})}
                                  >
                                      <option value="IP">ИП</option>
                                      <option value="OOO">ООО</option>
                                      <option value="Self">Самозанятый</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ИНН</label>
                              <input 
                                type="text" 
                                className="w-full p-3 border dark:border-slate-600 dark:bg-slate-700 rounded-lg dark:text-white"
                                placeholder="1234567890"
                                value={businessData.inn}
                                onChange={e => setBusinessData({...businessData, inn: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название магазина / Бренда</label>
                              <input 
                                type="text" 
                                className="w-full p-3 border dark:border-slate-600 dark:bg-slate-700 rounded-lg dark:text-white"
                                placeholder="Best Shop"
                                value={businessData.companyName}
                                onChange={e => setBusinessData({...businessData, companyName: e.target.value})}
                              />
                          </div>
                          <button onClick={() => setStep('logistics')} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
                              Далее
                          </button>
                      </div>
                  )}

                  {/* STEP 3: LOGISTICS */}
                  {step === 'logistics' && (
                      <div className="space-y-8 animate-fade-in">
                          <div className="text-center">
                              <h2 className="text-3xl font-bold dark:text-white mb-2">Выберите схему работы</h2>
                              <p className="text-gray-500">На этом этапе нужно выбрать одну схему. Подключить другие можно после начала работы.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {/* FBS */}
                              <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-lg ${logisticsModel === 'FBS' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-purple-200' : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'}`} onClick={() => setLogisticsModel('FBS')}>
                                  <div className="mb-4">
                                     <h3 className="text-2xl font-black mb-1 dark:text-white">FBS</h3>
                                     <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Fulfillment by Seller</p>
                                  </div>
                                  <div className="flex-1 space-y-4 mb-6">
                                      <div><p className="font-bold text-sm dark:text-gray-200">Доставка от Горизонта</p></div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Вы храните товары у себя. Заказы доставляем мы.</p>
                                  </div>
                                  <button className={`w-full py-2.5 rounded-lg font-bold transition ${logisticsModel === 'FBS' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                      {logisticsModel === 'FBS' ? 'Выбрано' : 'Выбрать'}
                                  </button>
                              </div>
                              {/* FBO */}
                              <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-lg ${logisticsModel === 'FBO' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-purple-200' : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'}`} onClick={() => setLogisticsModel('FBO')}>
                                  <div className="mb-4">
                                     <h3 className="text-2xl font-black mb-1 dark:text-white">FBO</h3>
                                     <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Fulfillment by Operator</p>
                                  </div>
                                  <div className="flex-1 space-y-4 mb-6">
                                      <div><p className="font-bold text-sm dark:text-gray-200">Хранение и доставка</p></div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Мы храним, упаковываем и доставляем ваши товары.</p>
                                  </div>
                                  <button className={`w-full py-2.5 rounded-lg font-bold transition ${logisticsModel === 'FBO' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                      {logisticsModel === 'FBO' ? 'Выбрано' : 'Выбрать'}
                                  </button>
                              </div>
                              {/* CNC */}
                              <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-lg ${logisticsModel === 'CNC' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-purple-200' : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'}`} onClick={() => setLogisticsModel('CNC')}>
                                  <div className="mb-4">
                                     <h3 className="text-2xl font-black mb-1 dark:text-white">C&C</h3>
                                     <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Click & Collect</p>
                                  </div>
                                  <div className="flex-1 space-y-4 mb-6">
                                      <div><p className="font-bold text-sm dark:text-gray-200">Выдача из магазина</p></div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Покупатель забирает заказ из вашей точки продаж.</p>
                                  </div>
                                  <button className={`w-full py-2.5 rounded-lg font-bold transition ${logisticsModel === 'CNC' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                      {logisticsModel === 'CNC' ? 'Выбрано' : 'Выбрать'}
                                  </button>
                              </div>
                              {/* DBS */}
                              <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-lg ${logisticsModel === 'DBS' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-purple-200' : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'}`} onClick={() => setLogisticsModel('DBS')}>
                                  <div className="mb-4">
                                     <h3 className="text-2xl font-black mb-1 dark:text-white">DBS</h3>
                                     <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Delivery by Seller</p>
                                  </div>
                                  <div className="flex-1 space-y-4 mb-6">
                                      <div><p className="font-bold text-sm dark:text-gray-200">Доставка продавцом</p></div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Вы сами полностью управляете логистикой.</p>
                                  </div>
                                  <button className={`w-full py-2.5 rounded-lg font-bold transition ${logisticsModel === 'DBS' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                      {logisticsModel === 'DBS' ? 'Выбрано' : 'Выбрать'}
                                  </button>
                              </div>
                          </div>

                          <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700 mt-6">
                              <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <input type="checkbox" className="mt-1" />
                                  <span>Я принимаю условия <a href="#" className="text-indigo-600 underline">Оферты</a> и даю согласие на обработку персональных данных.</span>
                              </div>
                              <button onClick={handleRegister} disabled={loading} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition flex justify-center items-center gap-2 shadow-lg shadow-purple-500/30">
                                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Подключиться'}
                              </button>
                          </div>
                      </div>
                  )}

                  {/* STEP 4: SUCCESS */}
                  {step === 'success' && (
                      <div className="text-center space-y-6 animate-fade-in py-8">
                          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircle className="w-10 h-10"/>
                          </div>
                          <h2 className="text-2xl font-bold dark:text-white">Кабинет создан!</h2>
                          <p className="text-gray-500">Заявка отправлена администратору. <br/> Текущий статус: <span className="font-bold text-yellow-500">На модерации</span></p>
                          
                          <button onClick={finishRegistration} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                              Перейти в кабинет продавца <ArrowRight className="w-4 h-4"/>
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
};
