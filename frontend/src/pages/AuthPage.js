import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    property_name: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/auth/login', loginData);
      toast.success('Login successful!');
      onLogin(response.data.access_token, response.data.user, response.data.tenant);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/auth/register', registerData);
      toast.success('Registration successful!');
      onLogin(response.data.access_token, response.data.user, response.data.tenant);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: 'white',
            marginBottom: '0.5rem',
            fontFamily: 'Space Grotesk'
          }}>RoomOps</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
            Complete Hotel Management Platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              {isLogin ? 'Login to your property account' : 'Register your hotel property'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      data-testid="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="property-name">Property Name</Label>
                    <Input
                      id="property-name"
                      data-testid="register-property-name"
                      value={registerData.property_name}
                      onChange={(e) => setRegisterData({...registerData, property_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-name">Admin Name</Label>
                    <Input
                      id="admin-name"
                      data-testid="register-admin-name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      data-testid="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      data-testid="register-phone"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      data-testid="register-address"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      data-testid="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    data-testid="register-submit-btn"
                  >
                    {loading ? 'Registering...' : 'Register Property'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
