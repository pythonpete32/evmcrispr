import Editor from '@monaco-editor/react';
import { useChain, useSpringRef } from '@react-spring/web';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Spinner,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';

import SelectWalletModal from '../components/modal';
import FadeIn from '../components/animations/fade-in';

import { theme } from '../editor/theme';
import { conf, contribution, language } from '../editor/evmcl';

import { useTerminal } from '../utils/useTerminal';
import Footer from '../components/footer';

const Terminal = () => {
  const {
    errors,
    loading,
    url,
    code,
    setCode,
    address,
    addressShortened,
    onForward,
    onDisconnect,
  } = useTerminal();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const terminalRef = useSpringRef();
  const buttonsRef = useSpringRef();
  const footerRef = useSpringRef();

  const forwardingText = `Forwarding from ${addressShortened}`;

  useChain([terminalRef, buttonsRef, footerRef]);

  return (
    <>
      <Box maxWidth="956px" margin="0 auto" my={16}>
        <FadeIn componentRef={terminalRef}>
          <Editor
            height="50vh"
            theme="theme"
            language="evmcl"
            value={code as string}
            onChange={(str) => setCode(str || '')}
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('theme', theme);
              monaco.languages.register(contribution);
              monaco.languages.setLanguageConfiguration('evmcl', conf);
              monaco.languages.setMonarchTokensProvider('evmcl', language);
            }}
            onMount={(editor) => {
              editor.setPosition({ lineNumber: 10000, column: 0 });
              editor.focus();
            }}
            options={{
              fontSize: 22,
              fontFamily: 'Ubuntu Mono',
              detectIndentation: false,
              tabSize: 2,
              language: 'evmcl',
              minimap: {
                enabled: false,
              },
              scrollbar: {
                useShadows: false,
                verticalScrollbarSize: 7,
                vertical: 'hidden',
              },
            }}
          />
        </FadeIn>
        <FadeIn componentRef={buttonsRef}>
          <VStack mt={3} alignItems="flex-end" gap={3} pr={{ base: 6, lg: 0 }}>
            {!address ? (
              <Button variant="lime" onClick={onOpen}>
                Connect
              </Button>
            ) : (
              <>
                {url ? (
                  <Button
                    variant="warning"
                    onClick={() => window.open(url, '_blank')}
                  >
                    Go to vote
                  </Button>
                ) : null}

                <Button variant="lime" onClick={onForward} disabled={loading}>
                  {loading ? (
                    <Box>
                      <Spinner verticalAlign="middle" /> {forwardingText}
                    </Box>
                  ) : (
                    forwardingText
                  )}
                </Button>
                <Button
                  variant="link"
                  color="white"
                  onClick={onDisconnect}
                  size="sm"
                >
                  Disconnect
                </Button>
              </>
            )}

            {errors ? (
              <Box justifyContent="left">
                {errors.map((e, index) => (
                  <Alert key={index} status="error">
                    <AlertIcon />
                    <AlertDescription>{e}</AlertDescription>
                  </Alert>
                ))}
              </Box>
            ) : null}
          </VStack>
        </FadeIn>
      </Box>
      <FadeIn componentRef={footerRef}>
        <Footer />
      </FadeIn>
      <SelectWalletModal isOpen={isOpen} closeModal={onClose} />
    </>
  );
};

export default Terminal;
