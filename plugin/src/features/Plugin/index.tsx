import React, { useEffect, useState } from 'react'

import { Environment } from '../Environment'
import './styles.css'

import Compilation from '../Compilation'
import Deployment from '../Deployment'
import Interaction from '../Interaction'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../components/ui_components/Accordian'
import TransactionHistory from '../TransactionHistory'
import CairoVersion from '../CairoVersion'
import StateAction from '../../components/StateAction'
import BackgroundNotices from '../../components/BackgroundNotices'
import ExplorerSelector, {
  useCurrentExplorer
} from '../../components/ExplorerSelector'
import { useAtomValue, useSetAtom } from 'jotai'
import { isCompilingAtom, statusAtom } from '../../atoms/compilation'
import { deploymentAtom } from '../../atoms/deployment'
import { pluginLoaded as atomPluginLoaded } from '../../atoms/remixClient'
import useRemixClient from '../../hooks/useRemixClient'
import { fetchGitHubFilesRecursively } from '../../utils/initial_scarb_codes'
export type AccordianTabs =
  | 'compile'
  | 'deploy'
  | 'interaction'
  | 'transactions'
  | ''

const Plugin: React.FC = () => {
  const isCompiling = useAtomValue(isCompilingAtom)
  const status = useAtomValue(statusAtom)

  const {
    isDeploying,
    deployStatus
  } = useAtomValue(deploymentAtom)

  // Interaction state variables
  const [interactionStatus, setInteractionStatus] = useState<'loading' | 'success' | 'error' | ''>('')

  const [currentAccordian, setCurrentAccordian] =
    useState<AccordianTabs>('compile')

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleTabView = (clicked: AccordianTabs) => {
    if (currentAccordian === clicked) {
      setCurrentAccordian('')
    } else {
      setCurrentAccordian(clicked)
    }
  }

  const explorerHook = useCurrentExplorer()

  const setPluginLoaded = useSetAtom(atomPluginLoaded)
  const { remixClient } = useRemixClient()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const id = setTimeout(async (): Promise<void> => {
      await remixClient.onload(() => {
        setPluginLoaded(true)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(async () => {
          const workspaces = await remixClient.filePanel.getWorkspaces()

          const workspaceLets: Array<{ name: string, isGitRepo: boolean }> =
                        JSON.parse(JSON.stringify(workspaces))

          if (
            !workspaceLets.some(
              (workspaceLet) => workspaceLet.name === 'cairo_scarb_sample'
            )
          ) {
            await remixClient.filePanel.createWorkspace(
              'cairo_scarb_sample',
              true
            )
            try {
              await remixClient.fileManager.mkdir('hello_world')
            } catch (e) {
              console.log(e)
            }
            const exampleRepo = await fetchGitHubFilesRecursively(
              'software-mansion/scarb',
              'examples/starknet_multiple_contracts'
            )

            console.log('exampleRepo', exampleRepo)

            try {
              for (const file of exampleRepo) {
                const filePath = file?.path
                  .replace('examples/starknet_multiple_contracts/', '')
                  .replace('examples/starknet_multiple_contracts', '') ?? ''

                let fileContent: string = file?.content ?? ''

                if (file != null && file.fileName === 'Scarb.toml') {
                  fileContent = fileContent.concat('\ncasm = true')
                }

                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                await remixClient.fileManager.writeFile(
                                    `hello_world/${
                                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                    filePath
                                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                    }/${file?.fileName}`,
                                    fileContent
                )
              }
            } catch (e) {
              if (e instanceof Error) {
                await remixClient.call('notification' as any, 'alert', {
                  id: 'starknetRemixPluginAlert',
                  title: 'Please check the write file permission',
                  message: e.message + '\n' + 'Did you provide the write file permission?'
                })
              }
              console.log(e)
            }
          }
        })
      })
    }, 1)
    return () => {
      clearInterval(id)
    }
  }, [])

  return (
    <>
      <div className="plugin-wrapper">
        <div className="plugin-main-wrapper">
          <CairoVersion />
          <Accordian
            type="single"
            value={currentAccordian}
            defaultValue={'compile'}
          >

            <AccordianItem value="compile">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('compile')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}>Compile</p>
                  <StateAction
                    value={
                      isCompiling
                        ? 'loading'
                        : status === 'done'
                          ? 'success'
                          : status === 'failed' ? 'error' : ''
                    }
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Compilation setAccordian={setCurrentAccordian} />
              </AccordionContent>
            </AccordianItem>

            <AccordianItem value="deploy">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('deploy')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}>Deploy</p>
                  <StateAction
                    value={
                      isDeploying
                        ? 'loading'
                        : deployStatus === 'error'
                          ? 'error'
                          : deployStatus === 'done'
                            ? 'success'
                            : ''
                    }
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Deployment setActiveTab={setCurrentAccordian} />
              </AccordionContent>
            </AccordianItem>
            <AccordianItem value="interaction">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('interaction')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}>Interact</p>
                  <StateAction
                    value={interactionStatus}
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Interaction setInteractionStatus={setInteractionStatus} />
              </AccordionContent>
            </AccordianItem>
            <AccordianItem value="transactions">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('transactions')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}> Transactions</p>
                  <ExplorerSelector
                    path=""
                    isTextVisible={false}
                    controlHook={explorerHook}
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <TransactionHistory controlHook={explorerHook} />
              </AccordionContent>
            </AccordianItem>
          </Accordian>
          <div className="mt-5">
            <BackgroundNotices />
          </div>
        </div>
        <div>
          <Environment />
        </div>
      </div>
    </>
  )
}

export default Plugin
